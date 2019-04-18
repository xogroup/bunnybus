'use strict';

const EventEmitter = require('events');
const Amqp = require('amqplib');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const SubscriptionManager = require('./subscriptionManager');
const EventLogger = require('./eventLogger');

const AMQP_CONNECTION_ERROR_EVENT = 'error';
const AMQP_CONNECTION_CLOSE_EVENT = 'close';
const AMQP_CHANNEL_ERROR_EVENT = 'error';
const AMQP_CHANNEL_CLOSE_EVENT = 'close';

let instance;

class BunnyBus extends EventEmitter {
    constructor(config) {
        if (instance) {
            if (config) {
                instance.config = config;
            }

            return instance;
        }

        super();
        instance = this;

        this._state = {
            recovery: false,
            activeConnection: false,
            activeChannel: false,
            connectionSemaphore: false,
            channelSemaphore: false
        };

        this.logger = new EventLogger(this);
        this._subscriptions = new SubscriptionManager();

        this._subscriptions.on(
            SubscriptionManager.BLOCKED_EVENT,
            this._handlers[SubscriptionManager.BLOCKED_EVENT]
        );
        this._subscriptions.on(
            SubscriptionManager.UNBLOCKED_EVENT,
            this._handlers[SubscriptionManager.UNBLOCKED_EVENT]
        );

        if (config) {
            this.config = config;
        }
    }

    static get DEFAULT_SERVER_CONFIGURATION() {
        return Helpers.defaultConfiguration.server;
    }

    static get DEFAULT_QUEUE_CONFIGURATION() {
        return Helpers.defaultConfiguration.queue;
    }

    static get DEFAULT_EXCHANGE_CONFIGURATION() {
        return Helpers.defaultConfiguration.exchange;
    }

    static get LOG_DEBUG_EVENT() {
        return EventLogger.LOG_DEBUG_EVENT;
    }

    static get LOG_INFO_EVENT() {
        return EventLogger.LOG_INFO_EVENT;
    }

    static get LOG_WARN_EVENT() {
        return EventLogger.LOG_WARN_EVENT;
    }

    static get LOG_ERROR_EVENT() {
        return EventLogger.LOG_ERROR_EVENT;
    }

    static get LOG_FATAL_EVENT() {
        return EventLogger.LOG_FATAL_EVENT;
    }

    static get PUBLISHED_EVENT() {
        return 'bunnybus.published';
    }

    static get SUBSCRIBED_EVENT() {
        return 'bunnybus.subscribed';
    }

    static get UNSUBSCRIBED_EVENT() {
        return 'bunnybus.unsubscribed';
    }

    static get RECOVERING_EVENT() {
        return 'bunnybus.recovering';
    }

    static get RECOVERED_EVENT() {
        return 'bunnybus.recovered';
    }

    static get AMQP_CONNECTION_ERROR_EVENT() {
        return 'amqp.connection.error';
    }

    static get AMQP_CONNECTION_CLOSE_EVENT() {
        return 'amqp.connection.close';
    }

    static get AMQP_CHANNEL_ERROR_EVENT() {
        return 'amqp.channel.error';
    }

    static get AMQP_CHANNEL_CLOSE_EVENT() {
        return 'amqp.channel.close';
    }

    get config() {
        return this._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {
        this._config = Object.assign(
            {},
            this._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION,
            value
        );
    }

    get subscriptions() {
        return this._subscriptions;
    }

    get logger() {
        return this._logger;
    }

    set logger(value) {
        if (Helpers.validateLoggerContract(value)) {
            this._logger = value;
        }
    }

    get connectionString() {
        return Helpers.createConnectionString(this.config);
    }

    get connection() {
        return this._connection;
    }

    set connection(value) {
        if (value) {
            value.on(
                AMQP_CONNECTION_ERROR_EVENT,
                this._handlers[BunnyBus.AMQP_CONNECTION_ERROR_EVENT]
            );
            value.on(
                AMQP_CONNECTION_CLOSE_EVENT,
                this._handlers[BunnyBus.AMQP_CONNECTION_CLOSE_EVENT]
            );
        }

        this._connection = value;
    }

    get hasConnection() {
        return !!this._connection;
    }

    get channel() {
        return this._channel;
    }

    set channel(value) {
        if (value) {
            value.on(
                AMQP_CHANNEL_ERROR_EVENT,
                this._handlers[BunnyBus.AMQP_CHANNEL_ERROR_EVENT]
            );
            value.on(
                AMQP_CHANNEL_CLOSE_EVENT,
                this._handlers[BunnyBus.AMQP_CHANNEL_CLOSE_EVENT]
            );
        }

        this._channel = value;
    }

    get hasChannel() {
        return !!this.channel;
    }

    async createExchange(name, type, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.assertExchange(name, type, {
            ...BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION,
            ...options
        });
    }

    async deleteExchange(name, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.deleteExchange(name, options);
    }

    async checkExchange(name) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.checkExchange(name);
    }

    async createQueue(name, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.assertQueue(name, {
            ...BunnyBus.DEFAULT_QUEUE_CONFIGURATION,
            ...options
        });
    }

    async deleteQueue(name, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.deleteQueue(name, options);
    }

    async checkQueue(name) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.checkQueue(name);
    }

    async send(message, queue, options) {
        const routeKey = Helpers.reduceRouteKey({ options, message });
        const { source, transactionId: tranId } = options || {};
        const createdAt = new Date().toISOString();
        const { version: bunnyBus } = Helpers.getPackageData();

        //connect, clean message, create transactionId
        const [, { isBuffer, buffer }, transactionId] = await Promise.all([
            await this._autoConnectChannel(),
            await Helpers.convertToBuffer(message),
            tranId || (await Helpers.createTransactionId())
        ]);

        await this.createQueue(queue);

        await this.channel.sendToQueue(queue, buffer, {
            headers: {
                transactionId,
                isBuffer,
                source,
                routeKey,
                createdAt,
                bunnyBus
            }
        });

        await this.channel.waitForConfirms();
    }

    async get(queue, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        return await this.channel.get(queue, options);
    }

    async getAll(queue, handler, options) {
        const { get: getOptions, meta } = options || {};

        //loop until no more messages
        const get = async () => {
            while (true) {
                const payload = await this.get(queue, getOptions);
                if (!payload) {
                    return;
                }

                this.logger.trace(payload);
                const { message, metaData } = Helpers.parsePayload(payload);

                meta
                    ? await handler(
                        message,
                        metaData,
                        this._ack.bind(null, payload)
                    )
                    : await handler(message, this._ack.bind(null, payload));
            }
        };

        await get();
    }

    async publish(message, options) {
        const {
            source,
            globalExchange = this.config.globalExchange,
            transactionId: tranId
        } = options || {};
        const routeKey = Helpers.reduceRouteKey({ options, message });
        const createdAt = new Date().toISOString();
        const { version: bunnyBus } = Helpers.getPackageData();

        if (!routeKey) {
            throw new Exceptions.NoRouteKeyError();
        }

        //connect, clean message, create transactionId
        const [, { isBuffer, buffer }, transactionId] = await Promise.all([
            await this._autoConnectChannel(),
            await Helpers.convertToBuffer(message),
            tranId || (await Helpers.createTransactionId())
        ]);

        const publishOptions = Helpers.buildPublishSendOptions({
            options,
            headers: {
                transactionId,
                isBuffer,
                source,
                routeKey,
                createdAt,
                bunnyBus
            }
        });
        await this.createExchange(globalExchange, 'topic');
        await this.channel.publish(
            globalExchange,
            routeKey,
            buffer,
            publishOptions
        );

        this.emit(BunnyBus.PUBLISHED_EVENT, message);
    }

    async subscribe(queue, handlers, options) {
        if (this.subscriptions.contains(queue)) {
            throw new Exceptions.SubscriptionExistError(queue);
        }

        this.subscriptions.create(queue, handlers, options);

        const {
            queue: queueOptions,
            globalExchange = this.config.globalExchange
        } = options || {};

        //initialize
        await this._autoConnectChannel();
        await Promise.all([
            await this.createQueue(queue, queueOptions),
            await this.createExchange(globalExchange, 'topic', null)
        ]);

        //bind routes
        const patterns = Object.keys(handlers || {});
        await Promise.all(
            patterns.map(async (pattern) => {
                await this.channel.bindQueue(queue, globalExchange, pattern);
            })
        );

        if (this.subscriptions.isBlocked(queue)) {
            throw new Exceptions.SubscriptionBlockedError(queue);
        }

        const { consumerTag } = await this.channel.consume(
            queue,
            async (payload) =>
                await this._consume({ queue, payload, options, handlers })
        );

        if (consumerTag) {
            this.subscriptions.tag(queue, consumerTag);
        }

        this.emit(BunnyBus.SUBSCRIBED_EVENT, queue);
    }

    async _consume({ queue, payload, options, handlers }) {
        if (!payload) {
            return;
        }

        const {
            maxRetryCount = this.config.maxRetryCount,
            validatePublisher = this.config.validatePublisher,
            validateVersion = this.config.validateVersion,
            meta
        } = options || {};

        this.logger.trace(payload);

        const { message, metaData } = Helpers.parsePayload(payload);
        const routeKey = Helpers.reduceRouteKey({
            payload,
            message
        });

        const {
            properties: {
                headers: { retryCount: currentRetryCount = -1, bunnyBus }
            }
        } = payload;

        const errorQueue = `${queue}_error`;
        const matchedHandlers = Helpers.handlerMatcher(handlers, routeKey);
        if (!matchedHandlers.length) {
            this.logger.warn(
                `message consumed with no matching routeKey (${routeKey}) handler`
            );
            return await this.channel.ack(payload);
        }

        // check for `bunnyBus` header first
        if (validatePublisher && !bunnyBus) {
            this.logger.warn('message not of BunnyBus origin');
            // should reject with error
            return await this._reject(payload, errorQueue);
        }

        // check for `bunnyBus`:<version> semver
        if (
            validatePublisher &&
            validateVersion &&
            !Helpers.isMajorCompatible(bunnyBus)
        ) {
            this.logger.warn(
                `message came from older bunnyBus version (${bunnyBus})`
            );
            // should reject with error
            return await this._reject(payload, errorQueue);
        }

        if (currentRetryCount >= maxRetryCount) {
            this.logger.warn(
                `message passed retry limit of ${maxRetryCount} for routeKey (${routeKey})`
            );
            // should reject with error
            return await this._reject(payload, errorQueue);
        }

        //call handlers
        await Promise.all(
            matchedHandlers.map(async (matchedHandler) => {
                meta
                    ? await matchedHandler(
                        message,
                        metaData,
                        this._ack.bind(null, payload),
                        this._reject.bind(null, payload, errorQueue),
                        this._requeue.bind(null, payload, queue, {
                            routeKey
                        })
                    )
                    : await matchedHandler(
                        message,
                        this._ack.bind(null, payload),
                        this._reject.bind(null, payload, errorQueue),
                        this._requeue.bind(null, payload, queue)
                    );
            })
        );
    }

    async _resubscribeAll() {
        const promises = [];

        for (const [queueName, { handlers, options }] of this.subscriptions
            ._subscriptions) {
            if (!this.subscriptions.isBlocked(queueName)) {
                promises.push(
                    this.subscribe.bind(this, queueName, handlers, options)
                );
                this.subscriptions.clear(queueName);
            }
        }

        await Promise.all(promises.map(async (p) => await p()));
    }

    async unsubscribe(queue) {
        const subscriptions = this.subscriptions;

        if (!subscriptions.contains(queue)) {
            return;
        }

        const { consumerTag } = subscriptions.get(queue);

        await this.channel.cancel(consumerTag);

        subscriptions.clear(queue);

        this.emit(BunnyBus.UNSUBSCRIBED_EVENT, queue);
    }

    //options to store calling module, queue name
    async _ack(payload, options) {
        if (!instance.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        await instance.channel.ack(payload);
    }

    async _requeue(payload, queue, options) {
        if (!instance.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        const routeKey = Helpers.reduceRouteKey({ payload, options });
        const {
            properties: { headers }
        } = payload;
        let { retryCount = 0 } = headers;
        ++retryCount;
        const requeuedAt = new Date().toISOString();
        const { version: bunnyBus } = Helpers.getPackageData();

        const sendOptions = Helpers.buildPublishSendOptions({
            options,
            headers: {
                ...headers,
                requeuedAt,
                retryCount,
                routeKey,
                bunnyBus
            }
        });

        await instance.channel.sendToQueue(queue, payload.content, sendOptions);
        await instance.channel.waitForConfirms();
        await instance._ack(payload);
    }

    async _reject(payload, errorQueue, options) {
        if (!instance.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        const queue = errorQueue || instance.config.server.errorQueue;
        const {
            properties: { headers }
        } = payload;
        const { retryCount = 0 } = headers;
        const erroredAt = new Date().toISOString();
        const { version: bunnyBus } = Helpers.getPackageData();

        const sendOptions = Helpers.buildPublishSendOptions({
            options,
            headers: { ...headers, erroredAt, retryCount, bunnyBus }
        });

        await instance.createQueue(queue);
        await instance.channel.sendToQueue(queue, payload.content, sendOptions);
        await instance.channel.waitForConfirms();
        await instance._ack(payload);
    }

    async _autoConnectChannel() {
        if (this.hasConnection && this.hasChannel) {
            return;
        }

        await this._createConnection();
        await this._createChannel();
    }

    async _recoverConnectChannel() {
        this._state.recovery = true;
        this.emit(BunnyBus.RECOVERING_EVENT);

        try {
            await this._autoConnectChannel();
            await this._resubscribeAll();
            this._state.recovery = false;
            this.emit(BunnyBus.RECOVERED_EVENT);
        }
        catch (error) {
            this.logger.fatal('failed to recover, exiting process');
            return process.exit(1);
        }
    }

    _delay(timeout) {
        return new Promise((resolve) => setTimeout(resolve, timeout));
    }

    async _createConnection() {
        this._state.activeConnection = true;

        if (this.hasConnection) {
            return;
        }

        const retryConnection = async () => {
            let retryCount = 0;

            //calculate if retry is going to happen
            const doRetry =
                !this.hasConnection &&
                retryCount <= this.config.maxConnectionRetryCount;

            while (doRetry) {
                try {
                    //try to connect
                    this.connection = await Amqp.connect(this.connectionString);

                    return;
                }
                catch (error) {
                    // increase try count
                    retryCount++;
                    //dns issues abort
                    if (error.code && error.code === 'ENOTFOUND') {
                        throw error;
                    }

                    //delay exec of next retry
                    await this._delay(Helpers.exponentialBackoff(retryCount));
                }
            }

            //if you got this far throw error
            throw new Exceptions.NoConnectionError();
        };

        await retryConnection();
    }

    async _closeConnection() {
        this._state.activeConnection = false;

        await this._closeChannel();

        if (this.hasConnection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    async _createChannel() {
        this._state.activeChannel = true;

        if (!this.hasConnection) {
            throw new Exceptions.NoConnectionError();
        }

        if (this.hasChannel) {
            return;
        }

        this.subscriptions.clearAll();

        const retryConnection = async () => {
            let retryCount = 0;

            //calculate if retry is going to happen
            const doRetry =
                !this.hasChannel &&
                retryCount <= this.config.maxConnectionRetryCount;

            while (doRetry) {
                try {
                    //try to create channel
                    this.channel = await this.connection.createConfirmChannel();

                    return await this.channel.prefetch(this.config.prefetch);
                }
                catch (error) {
                    // increase try count
                    retryCount++;

                    this.channel = null;
                    this._state.activeChannel = false;
                    //delay exec of next retry
                    await this._delay(Helpers.exponentialBackoff(retryCount));
                }
            }

            //if you got this far throw error
            throw new Exceptions.NoChannelError();
        };

        return await retryConnection();
    }

    async _closeChannel() {
        this._state.activeChannel = false;

        if (!this.hasChannel) {
            return;
        }

        await this.channel.close();
        this.channel = null;
    }

    get _handlers() {
        return {
            [SubscriptionManager.BLOCKED_EVENT]: async (queue) => {
                this.logger.info(`blocking queue this{queue}`);

                try {
                    await this.unsubscribe(queue);
                }
                catch (error) {
                    this.logger.error(error);
                }
            },
            [SubscriptionManager.UNBLOCKED_EVENT]: async (queue) => {
                this.logger.info(`unblocking queue this{queue}`);

                const subscription = this._subscriptions.get(queue);
                try {
                    await this.subscribe(
                        queue,
                        subscription.handlers,
                        subscription.options
                    );
                }
                catch (error) {
                    this.logger.error(error);
                }
            },
            [BunnyBus.AMQP_CONNECTION_ERROR_EVENT]: (error) => {
                this.emit(BunnyBus.AMQP_CONNECTION_ERROR_EVENT, error);

                this.logger.error('connection errored', error);
            },
            [BunnyBus.AMQP_CONNECTION_CLOSE_EVENT]: async (error) => {
                this.logger.info('connection closed', error);

                const rebuildConnection = this._state.activeConnection;
                this.connection = null;
                this.emit(BunnyBus.AMQP_CONNECTION_CLOSE_EVENT, error);

                if (rebuildConnection) {
                    await this._recoverConnectChannel();
                }
            },
            [BunnyBus.AMQP_CHANNEL_ERROR_EVENT]: (error) => {
                this.emit(BunnyBus.AMQP_CHANNEL_ERROR_EVENT, error);

                this.logger.error('channel errored', error);
            },
            [BunnyBus.AMQP_CHANNEL_CLOSE_EVENT]: async (error) => {
                this.logger.info('channel closed', error);

                const rebuildChannel =
                    this._state.activeChannel && this._state.activeConnection;
                this.channel = null; //we assume our channel is in fact dead
                this.emit(BunnyBus.AMQP_CHANNEL_CLOSE_EVENT, error);

                if (rebuildChannel) {
                    await this._recoverConnectChannel();
                }
            }
        };
    }
}

module.exports = BunnyBus;
