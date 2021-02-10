'use strict';

const EventEmitter = require('events').EventEmitter;
const Hoek = require('@hapi/hoek');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const { ChannelManager, ConnectionManager, SubscriptionManager } = require('./states');
const { SerialDispatcher, PartitionSerialDispatcher, ConcurrentDispatcher } = require('./schedulers');
const { EventLogger } = require('./loggers');

let singleton = undefined;

class BunnyBus extends EventEmitter {
    constructor(config) {
        super();

        this._state = {
            recoveryLock: false
        };

        this.logger = new EventLogger(this);
        this._subscriptions = new SubscriptionManager();
        this._connections = new ConnectionManager();
        this._channels = new ChannelManager();
        this._dispatchers = {
            serial: new SerialDispatcher(),
            partitionSerial: new PartitionSerialDispatcher(config),
            concurrent: new ConcurrentDispatcher()
        };
        this._handlerAssignmentLedger = new Map();

        this._subscriptions.on(SubscriptionManager.BLOCKED_EVENT, this._on_subscriptionManager_BLOCKED_EVENT.bind(this));
        this._subscriptions.on(SubscriptionManager.UNBLOCKED_EVENT, this._on_subscriptionManager_UNBLOCKED_EVENT.bind(this));

        if (config) {
            this.config = config;
        }

        return this;
    }

    static Singleton(config) {
        if (!singleton) {
            singleton = new BunnyBus();
        }

        if (config) {
            singleton.config = config;
        }

        return singleton;
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

    static get MESSAGE_DISPATCHED_EVENT() {
        return 'bunnybus.message-dispatched';
    }

    static get MESSAGE_ACKED_EVENT() {
        return 'bunnybus.message-acked';
    }

    static get MESSAGE_REJECTED_EVENT() {
        return 'bunnybus.message-rejected';
    }

    static get MESSAGE_REQUEUED_EVENT() {
        return 'bunnybus.message-requeued';
    }

    static get RECOVERING_CONNECTION_EVENT() {
        return 'bunnybus.recovering-connection';
    }

    static get RECOVERED_CONNECTION_EVENT() {
        return 'bunnybus.recovered-connection';
    }

    static get RECOVERING_CHANNEL_EVENT() {
        return 'bunnybus.recovering-channel';
    }

    static get RECOVERED_CHANNEL_EVENT() {
        return 'bunnybus.recovered-channel';
    }

    static get RECOVERY_FAILED_EVENT() {
        return 'bunnybus.recovery-failed';
    }

    static get DEFAULT_CONNECTION_NAME() {
        return 'default';
    }

    static MANAGEMENT_CHANNEL_NAME() {
        return 'admin-channel';
    }

    static QUEUE_CHANNEL_NAME(queue) {
        return `send-${queue}-channel`;
    }

    static PUBLISH_CHANNEL_NAME() {
        return 'publish-channel';
    }

    get config() {
        return this._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {
        this._config = Object.assign({}, this._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION, value);

        this._dispatchers.partitionSerial.config(this._config);
    }

    get subscriptions() {
        return this._subscriptions;
    }

    get connections() {
        return this._connections;
    }

    get channels() {
        return this._channels;
    }

    get logger() {
        return this._logger;
    }

    set logger(value) {
        if (!Helpers.validateLoggerContract(value)) {
            throw new Exceptions.IncompatibleLoggerError();
        }

        this._logger = value;
    }

    get healthy() {
        return this.connections.healthy && this.channels.healthy;
    }

    get connectionString() {
        return Helpers.createConnectionString(this.config);
    }

    async createExchange({ name, type, options }) {
        if (!this.config.disableExchangeCreate) {
            const channelContext = await this._autoBuildChannelContext({
                channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME()
            });

            //type : (direct, fanout, header, topic)
            return await channelContext.channel.assertExchange(
                name,
                type,
                Object.assign({}, BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION, options)
            );
        }
    }

    async deleteExchange({ name, options }) {
        const channelContext = await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });

        return await channelContext.channel.deleteExchange(name, options);
    }

    async checkExchange({ name }) {
        let result = undefined;

        const channelContext = await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });
        const promise = new Promise((resolve) => {
            channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
        });

        try {
            result = await channelContext.channel.checkExchange(name);
        } catch (err) {
            if (err.code !== 404) {
                throw err;
            }
        }

        // We want to own the process of channel recovery because calls down the chain
        // may get caught with a corrupted channel context where the channel is inoperable,
        // but still set to the context
        try {
            await Helpers.timeoutAsync(async () => await promise, 500)();
        } catch (err) {
            if (err.message !== 'Timeout occurred') {
                throw err;
            }
        } finally {
            await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });
        }

        return result;
    }

    async createQueue({ name, options }) {
        if (!this.config.disableQueueCreate) {
            const channelContext = await this._autoBuildChannelContext({
                channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME()
            });

            return await channelContext.channel.assertQueue(name, Object.assign({}, BunnyBus.DEFAULT_QUEUE_CONFIGURATION, options));
        }
    }

    async purgeQueue({ name }) {
        let result = false;

        const channelContext = await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });

        const promise = new Promise((resolve) => {
            channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
        });

        try {
            await channelContext.channel.purgeQueue(name);
            result = true;
        } catch (err) {
            if (err.code !== 404) {
                throw err;
            }
        }

        // We want to own the process of channel recovery because calls down the chain
        // may get caught with a corrupted channel context where the channel is inoperable,
        // but still set to the context
        try {
            await Helpers.timeoutAsync(async () => await promise, 500)();
        } catch (err) {
            if (err.message !== 'Timeout occurred') {
                throw err;
            }
        } finally {
            await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });
        }

        return result;
    }

    async deleteQueue({ name, options }) {
        const channelContext = await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });

        return await channelContext.channel.deleteQueue(name, options);
    }

    async checkQueue({ name }) {
        let result = undefined;

        const channelContext = await this._autoBuildChannelContext({
            channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME()
        });

        const promise = new Promise((resolve) => {
            channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
        });

        try {
            result = await channelContext.channel.checkQueue(name);
        } catch (err) {
            if (err.code !== 404) {
                throw err;
            }
        }

        // We want to own the process of channel recovery because calls down the chain
        // may get caught with a corrupted channel context where the channel is inoperable,
        // but still set to the context
        try {
            await Helpers.timeoutAsync(async () => await promise, 500);
        } catch (err) {
            if (err.Message !== 'Timeout occurred') {
                throw err;
            }
        } finally {
            await this._autoBuildChannelContext({ channelName: BunnyBus.MANAGEMENT_CHANNEL_NAME() });
        }

        return result;
    }

    async send({ message, queue, options }) {
        const routeKey = Helpers.reduceRouteKey(null, options, message);
        const source = options && options.source;

        const convertedMessage = Helpers.convertToBuffer(message);
        const transactionId = options && options.transactionId ? options.transactionId : Helpers.createTransactionId();
        const [channelContext] = await Promise.all([
            this._autoBuildChannelContext({ channelName: BunnyBus.QUEUE_CHANNEL_NAME(queue), queue }),
            this.createQueue({ name: queue })
        ]);

        const headers = {
            transactionId,
            isBuffer: convertedMessage.isBuffer,
            source,
            routeKey,
            createdAt: new Date().toISOString(),
            bunnyBus: Helpers.getPackageData().version
        };

        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await channelContext.channel.sendToQueue(queue, convertedMessage.buffer, sendOptions);
        await channelContext.channel.waitForConfirms();
    }

    async get({ queue, options }) {
        const channelContext = await this._autoBuildChannelContext({
            channelName: BunnyBus.QUEUE_CHANNEL_NAME(queue),
            queue
        });

        return await channelContext.channel.get(queue, options);
    }

    async getAll({ queue, handler, options }) {
        const getOptions = options && options.get;
        const channelName = BunnyBus.QUEUE_CHANNEL_NAME(queue);

        let processing = true;

        do {
            const payload = await this.get({ queue, options: getOptions });

            if (payload) {
                const parsedPayload = Helpers.parsePayload(payload);

                // Not currently handling poison message unlike subscribe

                await handler({
                    message: parsedPayload.message,
                    metaData: parsedPayload.metaData,
                    ack: this._ack.bind(this, { payload, channelName })
                });
            } else {
                processing = false;
            }
        } while (processing);
    }

    async publish({ message, options }) {
        const globalExchange = (options && options.globalExchange) || this.config.globalExchange;
        const routeKey = Helpers.reduceRouteKey(null, options, message);
        const source = options && options.source;
        const headerOptions = (options && options.headers) || {};

        if (!routeKey) {
            throw new Exceptions.NoRouteKeyError();
        }

        const convertedMessage = Helpers.convertToBuffer(message);
        const transactionId = options && options.transactionId ? options.transactionId : Helpers.createTransactionId();
        const [channelContext] = await Promise.all([
            this._autoBuildChannelContext({ channelName: BunnyBus.PUBLISH_CHANNEL_NAME() }),
            this.createExchange({ name: globalExchange, type: 'topic' })
        ]);

        const headers = {
            transactionId,
            isBuffer: convertedMessage.isBuffer,
            source,
            routeKey,
            createdAt: new Date().toISOString(),
            bunnyBus: Helpers.getPackageData().version,
            ...headerOptions
        };

        const publishOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await channelContext.channel.publish(globalExchange, routeKey, convertedMessage.buffer, publishOptions);
        await channelContext.channel.waitForConfirms();

        this.emit(BunnyBus.PUBLISHED_EVENT, publishOptions, message);
    }

    async subscribe({ queue, handlers, options }) {
        if (this.subscriptions.contains(queue)) {
            throw new Exceptions.SubscriptionExistError(queue);
        }

        if (this.subscriptions.isBlocked(queue)) {
            throw new Exceptions.SubscriptionBlockedError(queue);
        }

        this.subscriptions.create(queue, handlers, options);

        const queueOptions = options && options.queue ? options.queue : null;
        const globalExchange = (options && options.globalExchange) || this.config.globalExchange;
        const maxRetryCount = (options && options.maxRetryCount) || this.config.maxRetryCount;
        const validatePublisher = Hoek.reach(options, 'validatePublisher') || this.config.validatePublisher;
        const validateVersion = Hoek.reach(options, 'validateVersion') || this.config.validateVersion;
        const disableQueueBind = Hoek.reach(options, 'disableQueueBind') || this.config.disableQueueBind;
        const rejectUnroutedMessages = Hoek.reach(options, 'rejectUnroutedMessages') || this.config.rejectUnroutedMessages;
        const rejectPoisonMessages = Hoek.reach(options, 'rejectPoisonMessages') || this.config.rejectPoisonMessages;
        const channelName = BunnyBus.QUEUE_CHANNEL_NAME(queue);

        const channelContext = await this._autoBuildChannelContext({ channelName, queue });

        await Promise.all([
            this.createQueue({ name: queue, options: queueOptions }),
            this.createExchange({ name: globalExchange, type: 'topic' })
        ]);

        if (!disableQueueBind) {
            await Promise.all(Object.keys(handlers).map((pattern) => channelContext.channel.bindQueue(queue, globalExchange, pattern)));
        }

        const result = await channelContext.channel.consume(queue, async (payload) => {
            if (payload) {
                const parsedPayload = Helpers.parsePayload(payload);
                const errorQueue = `${queue}_error`;
                const poisonQueue = `${queue}_poison`;

                if (parsedPayload) {
                    const routeKey = Helpers.reduceRouteKey(payload, null, parsedPayload.message);
                    const currentRetryCount = payload.properties.headers.retryCount || -1;

                    const matchedHandlers = Helpers.handlerMatcher(handlers, routeKey);
                    if (parsedPayload && matchedHandlers.length > 0) {
                        // check for `bunnyBus` header first
                        if (
                            validatePublisher &&
                            !(payload.properties && payload.properties.headers && payload.properties.headers.bunnyBus)
                        ) {
                            const reason = 'message not of BunnyBus origin';
                            this.logger.warn(reason);
                            await this._reject({ payload, channelName, errorQueue }, { reason });
                        }
                        // check for `bunnyBus`:<version> semver
                        else if (validatePublisher && validateVersion && !Helpers.isMajorCompatible(payload.properties.headers.bunnyBus)) {
                            const reason = `message came from older bunnyBus version (${payload.properties.headers.bunnyBus})`;
                            this.logger.warn(reason);
                            await this._reject({ payload, channelName, errorQueue }, { reason });
                        } else if (currentRetryCount < maxRetryCount) {
                            matchedHandlers.forEach(async (matchedHandler) => {
                                this._dispatchers[this.config.dispatchType].push(
                                    queue,
                                    async () => {
                                        this.emit(BunnyBus.MESSAGE_DISPATCHED_EVENT, parsedPayload.metaData, parsedPayload.message);

                                        await matchedHandler({
                                            message: parsedPayload.message,
                                            metaData: parsedPayload.metaData,
                                            ack: this._ack.bind(this, { payload, channelName }),
                                            rej: this._reject.bind(this, { payload, channelName, errorQueue }),
                                            requeue: this._requeue.bind(this, {
                                                payload,
                                                channelName,
                                                queue
                                            })
                                        });
                                    },
                                    parsedPayload
                                );
                            });
                        } else {
                            const reason = `message passed retry limit of ${maxRetryCount} for routeKey (${routeKey})`;
                            this.logger.warn(reason);
                            await this._reject({ payload, channelName, errorQueue }, { reason });
                        }
                    } else {
                        const reason = `message consumed with no matching routeKey (${routeKey}) handler`;
                        this.logger.warn(reason);
                        if (rejectUnroutedMessages) {
                            await this._reject({ payload, channelName, errorQueue }, { reason });
                        } else {
                            // acking this directly to channel so events don't fire
                            await channelContext.channel.ack(payload);
                        }
                    }
                } else {
                    const reason = `corrupted payload content intercepted`;
                    this.logger.warn(reason);
                    if (rejectPoisonMessages) {
                        await this._reject({ payload, channelName, errorQueue: poisonQueue }, { reason });
                    } else {
                        // acking this directly to channel so events don't fire
                        await channelContext.channel.ack(payload);
                    }
                }
            }
        });

        if (result && result.consumerTag) {
            this.subscriptions.tag(queue, result.consumerTag);
            this.emit(BunnyBus.SUBSCRIBED_EVENT, queue);
        }
    }

    async unsubscribe({ queue }) {
        const channelContext = await this._autoBuildChannelContext({ channelName: BunnyBus.QUEUE_CHANNEL_NAME(queue) });

        if (this.subscriptions.contains(queue)) {
            await channelContext.channel.cancel(this.subscriptions.get(queue).consumerTag);
            this.subscriptions.clear(queue);
            this.emit(BunnyBus.UNSUBSCRIBED_EVENT, queue);
        }
    }

    async resubscribe({ queue }) {
        if (
            this.subscriptions.contains(queue, false) &&
            !this.subscriptions.contains(queue, true) &&
            !this.subscriptions.isBlocked(queue)
        ) {
            const { handlers, options } = this.subscriptions.get(queue);
            await this.subscribe({ queue, handlers, options });
        }
    }

    async stop() {
        this.subscriptions.list().map((subscription) => this.subscriptions.remove(subscription.queue));
        await Promise.allSettled(this.channels.list().map((context) => this.channels.remove(context.name)));
        await Promise.allSettled(this.connections.list().map((context) => this.connections.remove(context.name)));
    }

    //options to store calling module, queue name
    async _ack({ payload, channelName }, options) {
        const channelContext = await this._autoBuildChannelContext({ channelName });

        await channelContext.channel.ack(payload);

        const parsedPayload = Helpers.parsePayload(payload);
        parsedPayload.metaData.headers.ackedAt = new Date().toISOString();

        this.emit(BunnyBus.MESSAGE_ACKED_EVENT, parsedPayload.metaData, parsedPayload.message);
    }

    async _requeue({ payload, channelName, queue }, options) {
        const channelContext = await this._autoBuildChannelContext({ channelName });

        const routeKey = Helpers.reduceRouteKey(payload, options);

        const headers = {
            transactionId: payload.properties.headers.transactionId,
            isBuffer: payload.properties.headers.isBuffer,
            source: payload.properties.headers.source,
            createdAt: payload.properties.headers.createdAt,
            requeuedAt: new Date().toISOString(),
            retryCount: payload.properties.headers.retryCount || 0,
            bunnyBus: Helpers.getPackageData().version,
            routeKey
        };
        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        ++sendOptions.headers.retryCount;

        await channelContext.channel.sendToQueue(queue, payload.content, sendOptions);
        await channelContext.channel.waitForConfirms();
        await channelContext.channel.ack(payload);

        const parsedPayload = Helpers.parsePayload(payload);
        parsedPayload.metaData.headers = Object.assign(parsedPayload.metaData.headers, headers);

        this.emit(BunnyBus.MESSAGE_REQUEUED_EVENT, parsedPayload.metaData, parsedPayload.message);
    }

    async _reject({ payload, channelName, errorQueue }, options) {
        const channelContext = await this._autoBuildChannelContext({ channelName });

        const queue = Helpers.reduceErrorQueue(Hoek.reach(this.config, 'errorQueue'), errorQueue, Hoek.reach(options, 'errorQueue'));

        const headers = {
            transactionId: payload.properties.headers.transactionId,
            isBuffer: payload.properties.headers.isBuffer,
            source: payload.properties.headers.source,
            createdAt: payload.properties.headers.createdAt,
            requeuedAt: payload.properties.headers.requeuedAt,
            erroredAt: new Date().toISOString(),
            retryCount: payload.properties.headers.retryCount || 0,
            bunnyBus: Helpers.getPackageData().version,
            reason: Hoek.reach(options, 'reason')
        };

        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await this.createQueue({ name: queue });
        await channelContext.channel.sendToQueue(queue, payload.content, sendOptions);
        await channelContext.channel.waitForConfirms();
        await channelContext.channel.ack(payload);

        let parsedPayload = Helpers.parsePayload(payload);

        if (parsedPayload) {
            parsedPayload.metaData.headers = Object.assign(parsedPayload.metaData.headers, headers);
        } else {
            parsedPayload = {};
        }

        this.emit(BunnyBus.MESSAGE_REJECTED_EVENT, parsedPayload.metaData, parsedPayload.message);
    }

    async _autoBuildChannelContext({ channelName, queue = null }) {
        let connectionContext = undefined;
        let channelContext = this.channels.get(channelName);

        if (channelContext && channelContext.channel && channelContext.connectionContext.connection) {
            return channelContext;
        }

        const addListener = (subject, eventName, handler) => {
            const key = `${subject.uniqueName}_${eventName}`;
            if (!this._handlerAssignmentLedger.has(key)) {
                this._handlerAssignmentLedger.set(key, handler);
                subject.on(eventName, handler);
            }
        };

        connectionContext = await this.connections.create(BunnyBus.DEFAULT_CONNECTION_NAME, this.config);
        addListener(
            connectionContext,
            ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT,
            this._on_connectionManager_AMQP_CONNECTION_CLOSE_EVENT.bind(this)
        );
        addListener(
            connectionContext,
            ConnectionManager.AMQP_CONNECTION_ERROR_EVENT,
            this._on_connectionManager_AMQP_CONNECTION_ERROR_EVENT.bind(this)
        );

        channelContext = await this.channels.create(channelName, queue, connectionContext, this.config);
        addListener(channelContext, ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, this._on_channelManager_AMQP_CHANNEL_CLOSE_EVENT.bind(this));
        addListener(channelContext, ChannelManager.AMQP_CHANNEL_ERROR_EVENT, this._on_channelManager_AMQP_CHANNEL_ERROR_EVENT.bind(this));

        return channelContext;
    }

    async _recoverConnection() {
        for (const { name, queue } of this.channels.list()) {
            if (queue) {
                await this._recoverChannel({ channelName: name });
            }
        }
    }

    async _recoverChannel({ channelName }) {
        if (!this._state.recoveryLock) {
            this._state.recoveryLock = true;

            try {
                const { queue } = this.channels.get(channelName);

                if (queue && this.subscriptions.contains(queue, false)) {
                    const { handlers, options } = this.subscriptions.get(queue);

                    if (!this.subscriptions.isBlocked(queue)) {
                        this.subscriptions.clear(queue);
                        await this.subscribe({ queue, handlers, options });
                    }
                }
            } catch (err) {
                err.bunnyBusMessage = 'failed to recover, exiting process';
                this.logger.fatal(err);
                this.emit(BunnyBus.RECOVERY_FAILED_EVENT, err);
                throw err;
            } finally {
                this._state.recoveryLock = false;
            }
        }
    }

    async _on_subscriptionManager_BLOCKED_EVENT(queue) {
        this.logger.info(`blocking queue ${queue}`);

        try {
            await this.unsubscribe({ queue });
        } catch (err) {
            err.bunnyBusMessage = 'blocked event handling failed';
            this.logger.error(err);
        }
    }

    async _on_subscriptionManager_UNBLOCKED_EVENT(queue) {
        const subscription = this._subscriptions.get(queue);

        this.logger.info(`unblocking queue ${queue}`);

        try {
            await this.subscribe({ queue, handlers: subscription.handlers, options: subscription.options });
        } catch (err) {
            err.bunnyBusMessage = 'unblocked event handling failed';
            this.logger.error(err);
        }
    }

    _on_connectionManager_AMQP_CONNECTION_ERROR_EVENT(err, context) {
        err.bunnyBusMessage = 'connection error';
        err.context = context;
        this.logger.error(err);
    }

    async _on_connectionManager_AMQP_CONNECTION_CLOSE_EVENT(context) {
        this.logger.info(`${context.name} connection closed`);

        try {
            this.emit(BunnyBus.RECOVERING_CONNECTION_EVENT, context.name);
            await this._recoverConnection();
            this.emit(BunnyBus.RECOVERED_CONNECTION_EVENT, context.name);
        } catch (err) {}
    }

    _on_channelManager_AMQP_CHANNEL_ERROR_EVENT(err, context) {
        err.bunnyBusMessage = 'channel errored';
        err.context = context;
        this.logger.error(err);
    }

    async _on_channelManager_AMQP_CHANNEL_CLOSE_EVENT(context) {
        this.logger.info(`${context.name} channel closed`);

        try {
            this.emit(BunnyBus.RECOVERING_CHANNEL_EVENT, context.name);
            await this._recoverChannel({ channelName: context.name });
            this.emit(BunnyBus.RECOVERED_CHANNEL_EVENT, context.name);
        } catch (err) {}
    }
}

module.exports = BunnyBus;
