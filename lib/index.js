'use strict';

const EventEmitter = require('events');
const Amqp = require('amqplib');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const SubscriptionManager = require('./subscriptionManager');
const EventLogger = require('./eventLogger');

class BunnyBus extends EventEmitter {
    constructor(config) {
        super();

        this.logger = new EventLogger(this);
        this._subscriptions = new SubscriptionManager();

        this._subscriptions.on(SubscriptionManager.Events.BLOCKED, queue =>
            this._on_subscriptionManager_BLOCKED(queue)
        );
        this._subscriptions.on(SubscriptionManager.Events.UNBLOCKED, queue =>
            this._on_subscriptionManager_UNBLOCKED(queue)
        );

        if (config) {
            this.config = config;
        }
    }

    static get Defaults() {
        const { server, queue, exchange } = Helpers.defaultConfiguration;

        return {
            SERVER_CONFIGURATION: server,
            QUEUE_CONFIGURATION: queue,
            EXCHANGE_CONFIGURATION: exchange,
        };
    }

    static get Events() {
        return {
            PUBLISHED: 'bunnybus.published',
            SUBSCRIBED: 'bunnybus.subscribed',
            UNSUBSCRIBED: 'bunnybus.unsubscribed',
            RECOVERING: 'bunnybus.recovering',
            RECOVERED: 'bunnybus.recovered',
            FATAL: 'bunnybus.fatal',
            AMQP_CONNECTION_ERROR: 'amqp.connection.error',
            AMQP_CONNECTION_CLOSE: 'amqp.connection.close',
            AMQP_CHANNEL_ERROR: 'amqp.channel.error',
            AMQP_CHANNEL_CLOSE: 'amqp.channel.close',
            LOG_DEBUG: EventLogger.Events.DEBUG,
            LOG_INFO: EventLogger.Events.INFO,
            LOG_WARN: EventLogger.Events.WARN,
            LOG_ERROR: EventLogger.Events.ERROR,
            LOG_FATAL: EventLogger.Events.FATAL,
        };
    }

    get config() {
        return this._config || BunnyBus.Defaults.SERVER_CONFIGURATION;
    }

    set config(value) {
        this._config = {
            ...(this._config || BunnyBus.Defaults.SERVER_CONFIGURATION),
            ...value,
        };
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
            value.on('error', error => this._on_AMQP_CONNECTION_ERROR(error));
            value.on('close', error => this._on_AMQP_CONNECTION_CLOSE(error));
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
            value.on('error', error => this._on_AMQP_CHANNEL_ERROR(error));
            value.on('close', error => this._on_AMQP_CHANNEL_CLOSE(error));
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
            ...BunnyBus.Defaults.EXCHANGE_CONFIGURATION,
            ...options,
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
            ...BunnyBus.Defaults.QUEUE_CONFIGURATION,
            ...options,
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
            await this.connect(),
            await Helpers.convertToBuffer(message),
            tranId || (await Helpers.createTransactionId()),
        ]);

        await this.createQueue(queue);

        const sendOptions = Helpers.buildPublishSendOptions({
            options,
            headers: {
                transactionId,
                isBuffer,
                source,
                routeKey,
                createdAt,
                bunnyBus,
            },
        });

        await this.channel.sendToQueue(queue, buffer, sendOptions);
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
        let eof = false;
        while (!eof) {
            const payload = await this.get(queue, getOptions);
            if (!payload) {
                eof = true;
                return;
            }

            this.logger.trace(payload);
            const { message, metaData } = Helpers.parsePayload(payload);

            const ack = async () => await this._ack(payload);
            meta
                ? await handler(message, metaData, ack)
                : await handler(message, ack);
        }
    }

    async publish(message, options) {
        const {
            source,
            globalExchange = this.config.globalExchange,
            transactionId: tranId,
        } = options || {};
        const routeKey = Helpers.reduceRouteKey({ options, message });
        const createdAt = new Date().toISOString();
        const { version: bunnyBus } = Helpers.getPackageData();

        if (!routeKey) {
            throw new Exceptions.NoRouteKeyError();
        }

        //connect, clean message, create transactionId
        const [, { isBuffer, buffer }, transactionId] = await Promise.all([
            await this.connect(),
            await Helpers.convertToBuffer(message),
            tranId || Helpers.createTransactionId(),
        ]);

        const publishOptions = Helpers.buildPublishSendOptions({
            options,
            headers: {
                transactionId,
                isBuffer,
                source,
                routeKey,
                createdAt,
                bunnyBus,
            },
        });
        await this.createExchange(globalExchange, 'topic');
        await this.channel.publish(
            globalExchange,
            routeKey,
            buffer,
            publishOptions
        );

        this.emit(BunnyBus.Events.PUBLISHED, message);
    }

    async subscribe(queue, handlers, options) {
        if (this.subscriptions.contains(queue)) {
            throw new Exceptions.SubscriptionExistError(queue);
        }

        this.subscriptions.create(queue, handlers, options);

        const {
            queue: queueOptions,
            globalExchange = this.config.globalExchange,
        } = options || {};

        //initialize
        await this.connect();
        await Promise.all([
            await this.createQueue(queue, queueOptions),
            await this.createExchange(globalExchange, 'topic'),
        ]);

        //bind routes
        const patterns = Object.keys(handlers || {});
        await Promise.all(
            patterns.map(async pattern => {
                await this.channel.bindQueue(queue, globalExchange, pattern);
            })
        );

        if (this.subscriptions.isBlocked(queue)) {
            throw new Exceptions.SubscriptionBlockedError(queue);
        }

        const { consumerTag } = await this.channel.consume(
            queue,
            async payload =>
                await this._consume({ queue, payload, options, handlers })
        );

        if (consumerTag) {
            this.subscriptions.tag(queue, consumerTag);
        }

        this.emit(BunnyBus.Events.SUBSCRIBED, queue);
    }

    async _consume({ queue, payload, options, handlers }) {
        if (!payload) {
            return;
        }

        const {
            maxRetryCount = this.config.maxRetryCount,
            validatePublisher = this.config.validatePublisher,
            validateVersion = this.config.validateVersion,
            meta,
        } = options || {};

        this.logger.trace(payload);

        const { message, metaData } = Helpers.parsePayload(payload);
        const routeKey = Helpers.reduceRouteKey({
            payload,
            message,
        });

        const {
            properties: {
                headers: { retryCount: currentRetryCount = -1, bunnyBus },
            },
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

        const ack = async () => await this._ack(payload);
        const reject = async () => await this._reject(payload, errorQueue);
        const requeueOptions =
            (meta && {
                routeKey,
            }) ||
            null;
        const requeue = async () =>
            await this._requeue(payload, queue, requeueOptions);

        //call handlers
        await Promise.all(
            matchedHandlers.map(async matchedHandler => {
                meta
                    ? await matchedHandler(
                          message,
                          metaData,
                          ack,
                          reject,
                          requeue
                      )
                    : await matchedHandler(message, ack, reject, requeue);
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

        await Promise.all(promises.map(async p => await p()));
    }

    async unsubscribe(queue) {
        if (!this.subscriptions.contains(queue)) {
            return;
        }

        const { consumerTag } = this.subscriptions.get(queue);
        await this.channel.cancel(consumerTag);
        this.subscriptions.clear(queue);
        this.emit(BunnyBus.Events.UNSUBSCRIBED, queue);
    }

    async _ack(payload, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        await this.channel.ack(payload);
    }

    async _requeue(payload, queue, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        const routeKey = Helpers.reduceRouteKey({ payload, options });
        const {
            properties: { headers },
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
                bunnyBus,
            },
        });

        await this.channel.sendToQueue(queue, payload.content, sendOptions);
        await this.channel.waitForConfirms();
        await this._ack(payload);
    }

    async _reject(payload, errorQueue, options) {
        if (!this.hasChannel) {
            throw new Exceptions.NoChannelError();
        }

        const queue = errorQueue || this.config.server.errorQueue;
        const {
            properties: { headers },
        } = payload;
        const { retryCount = 0 } = headers;
        const erroredAt = new Date().toISOString();
        const { version: bunnyBus } = Helpers.getPackageData();

        const sendOptions = Helpers.buildPublishSendOptions({
            options,
            headers: { ...headers, erroredAt, retryCount, bunnyBus },
        });

        await this.createQueue(queue);
        await this.channel.sendToQueue(queue, payload.content, sendOptions);
        await this.channel.waitForConfirms();
        await this._ack(payload);
    }

    async connect() {
        if (this.hasConnection && this.hasChannel) {
            return;
        }

        await this._createConnection();
        await this._createChannel();
    }

    async _recoverConnection() {
        let retryCount = 0;
        while (!(this.hasConnection && this.hasChannel)) {
            try {
                this.emit(BunnyBus.Events.RECOVERING);

                await this.connect();
                await this._resubscribeAll();

                this.emit(BunnyBus.Events.RECOVERED);
            } catch (error) {
                // increase try count
                // if exceeds max retries bubble up error
                if (++retryCount >= this.config.autoRecoveryRetryCount) {
                    this.logger.fatal('failed to connect');
                    // this.recovering = false;
                    this.emit(BunnyBus.Events.FATAL, error);
                    return;
                }

                //delay exec of next retry
                await Helpers.delay(Helpers.exponentialBackoff(retryCount));
            }
        }
    }

    async _createConnection() {
        if (this.hasConnection) {
            return;
        }

        try {
            //try to connect
            this.connection = await Amqp.connect(this.connectionString);
        } catch (error) {
            this.connection = null;
            throw error;
        }
    }

    async _closeConnection() {
        await this._closeChannel();

        if (this.hasConnection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    async _createChannel() {
        if (!this.hasConnection) {
            throw new Exceptions.NoConnectionError();
        }

        if (this.hasChannel) {
            return;
        }

        this.subscriptions.clearAll();
        try {
            //try to create channel
            this.channel = await this.connection.createConfirmChannel();

            await this.channel.prefetch(this.config.prefetch);
        } catch (error) {
            this.channel = null;
            throw error;
        }
    }

    async _closeChannel() {
        if (!this.hasChannel) {
            return;
        }

        await this.channel.close();
        this.channel = null;
    }

    async _on_subscriptionManager_BLOCKED(queue) {
        this.logger.info(`blocking queue this{queue}`);
        try {
            await this.unsubscribe(queue);
        } catch (error) {
            this.logger.error(error);
        }
    }

    async _on_subscriptionManager_UNBLOCKED(queue) {
        this.logger.info(`unblocking queue this{queue}`);
        try {
            const { handlers, options } = this.subscriptions.get(queue);
            await this.subscribe(queue, handlers, options);
        } catch (error) {
            this.logger.error(error);
        }
    }

    _on_AMQP_CONNECTION_ERROR(error) {
        this.logger.error('connection errored', error);
        this.emit(BunnyBus.Events.AMQP_CONNECTION_ERROR, error);
    }

    _on_AMQP_CONNECTION_CLOSE(error) {
        this.logger.info('connection closed', error);
        this.connection = null;
        this.channel = null;
        this.emit(BunnyBus.Events.AMQP_CONNECTION_CLOSE, error);
        if (this.config.autoRecovery) {
            this._recoverConnection();
        }
    }

    _on_AMQP_CHANNEL_ERROR(error) {
        this.logger.error('channel errored', error);
        this.emit(BunnyBus.Events.AMQP_CHANNEL_ERROR, error);
    }

    _on_AMQP_CHANNEL_CLOSE(error) {
        this.logger.info('channel closed', error);
        this.channel = null;
        this.emit(BunnyBus.Events.AMQP_CHANNEL_CLOSE, error);
        if (this.config.autoRecovery) {
            this._recoverConnection();
        }
    }
}

module.exports = BunnyBus;
