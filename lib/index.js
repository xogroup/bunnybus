'use strict';

const EventEmitter = require('events').EventEmitter;
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const { ChannelManager, ConnectionManager, SubscriptionManager } = require('./states');
const { EventLogger } = require('./loggers');

const internals = {
    handlers : {}
};

let $ = undefined;

class BunnyBus extends EventEmitter{

    constructor(config) {

        if (!$) {
            super();

            $ = this;

            $._state = {
                recoveryLock    : false
            };

            $.logger = new EventLogger($);
            $._subscriptions = new SubscriptionManager();
            $._connections = new ConnectionManager();
            $._channels = new ChannelManager();

            $._subscriptions.on(SubscriptionManager.BLOCKED_EVENT, internals.handlers[SubscriptionManager.BLOCKED_EVENT]);
            $._subscriptions.on(SubscriptionManager.UNBLOCKED_EVENT, internals.handlers[SubscriptionManager.UNBLOCKED_EVENT]);
        }

        if (config) {
            $.config = config;
        }

        return $;
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

        return $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {

        $._config = Object.assign({}, $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION, value);
    }

    get subscriptions() {

        return $._subscriptions;
    }

    get connections() {

        return $._connections;
    }

    get channels() {

        return $._channels;
    }

    get logger() {

        return $._logger;
    }

    set logger(value) {

        if (!Helpers.validateLoggerContract(value)) {
            throw new Exceptions.IncompatibleLoggerError();
        }

        $._logger = value;
    }

    get connectionString() {

        return Helpers.createConnectionString($.config);
    }

    async createExchange(name, type, options) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        //type : (direct, fanout, header, topic)
        return await channelContext.channel.assertExchange(name, type, Object.assign({}, BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION, options));
    }

    async deleteExchange(name, options) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        return await channelContext.channel.deleteExchange(name, options);
    }

    async checkExchange(name) {

        let result = false;

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        const promise = new Promise((resolve) => {

            channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
        });

        try {
            await channelContext.channel.checkExchange(name);
            result = true;
        }
        catch (err) {

            if (err.code !== 404) {
                throw err;
            }
        }

        // We want to own the process of channel recovery because calls down the chain
        // may get caught with a corrupted channel context where the channel is inoperable,
        // but still set to the context
        try {
            await Helpers.timeoutAsync(async () => await promise, 500);
        }
        catch (err) {
            if (err.Message !== 'Timeout occurred') {
                throw err;
            }
        }
        finally {
            await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());
        }

        return result;
    }

    async createQueue(name, options) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        return await channelContext.channel.assertQueue(name, Object.assign({}, BunnyBus.DEFAULT_QUEUE_CONFIGURATION, options));
    }

    async purgeQueue(name) {

        let result = false;

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        const promise = new Promise((resolve) => {

            channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
        });

        try {
            await channelContext.channel.purgeQueue(name);
            result = true;
        }
        catch (err) {

            if (err.code !== 404) {
                throw err;
            }
        }

        // We want to own the process of channel recovery because calls down the chain
        // may get caught with a corrupted channel context where the channel is inoperable,
        // but still set to the context
        try {
            await Helpers.timeoutAsync(async () => await promise, 500);
        }
        catch (err) {
            if (err.Message !== 'Timeout occurred') {
                throw err;
            }
        }
        finally {
            await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());
        }

        return result;
    }

    async deleteQueue(name, options) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        return await channelContext.channel.deleteQueue(name, options);
    }

    async checkQueue(name) {

        let result = false;

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        const promise = new Promise((resolve) => {

            channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
        });

        try {
            await channelContext.channel.checkQueue(name);
            result = true;
        }
        catch (err) {

            if (err.code !== 404) {
                throw err;
            }
        }

        // We want to own the process of channel recovery because calls down the chain
        // may get caught with a corrupted channel context where the channel is inoperable,
        // but still set to the context
        try {
            await Helpers.timeoutAsync(async () => await promise, 500);
        }
        catch (err) {
            if (err.Message !== 'Timeout occurred') {
                throw err;
            }
        }
        finally {
            await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());
        }

        return result;
    }

    async send(message, queue, options) {

        const routeKey = Helpers.reduceRouteKey(null, options, message);
        const source = (options && options.source);

        const [convertedMessage, transactionId, channelContext] = await Promise.all([
            Helpers.convertToBufferAsync(message),
            (async () => {

                return (options && options.transactionId)
                    ? options.transactionId
                    : await Helpers.createTransactionIdAsync();
            })(),
            $._autoBuildChannelContext(BunnyBus.QUEUE_CHANNEL_NAME(queue), queue),
            $.createQueue(queue)
        ]);

        const headers = {
            transactionId,
            isBuffer: convertedMessage.isBuffer,
            source,
            routeKey,
            createdAt: (new Date()).toISOString(),
            bunnyBus: Helpers.getPackageData().version
        };

        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await channelContext.channel.sendToQueue(queue, convertedMessage.buffer, sendOptions);
        await channelContext.channel.waitForConfirms();
    }

    async get(queue, options) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.QUEUE_CHANNEL_NAME(queue), queue);

        return await channelContext.channel.get(queue, options);
    }

    async getAll(queue, handler, options) {

        const getOptions = (options && options.get);
        const meta = (options && options.meta);
        const channelName = BunnyBus.QUEUE_CHANNEL_NAME(queue);

        let processing = true;

        do {
            const payload = await $.get(queue, getOptions);

            if (payload) {
                const parsedPayload = Helpers.parsePayload(payload);

                if (meta) {
                    await handler(
                        parsedPayload.message,
                        parsedPayload.metaData,
                        $._ack.bind(null, payload, channelName)
                    );
                }
                else {
                    await handler(
                        parsedPayload.message,
                        $._ack.bind(null, payload, channelName)
                    );
                }
            }
            else {
                processing = false;
            }
        } while (processing);
    }

    async publish(message, options) {

        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const routeKey = Helpers.reduceRouteKey(null, options, message);
        const source = (options && options.source);

        if (!routeKey) {
            throw new Exceptions.NoRouteKeyError();
        }

        const [convertedMessage, transactionId, channelContext] = await Promise.all([
            Helpers.convertToBufferAsync(message),
            (async () => {

                return (options && options.transactionId)
                    ? options.transactionId
                    : await Helpers.createTransactionIdAsync();
            })(),
            $._autoBuildChannelContext(BunnyBus.PUBLISH_CHANNEL_NAME()),
            $.createExchange(globalExchange, 'topic', null)
        ]);

        const headers = {
            transactionId,
            isBuffer: convertedMessage.isBuffer,
            source,
            routeKey,
            createdAt: (new Date()).toISOString(),
            bunnyBus: Helpers.getPackageData().version
        };

        const publishOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await channelContext.channel.publish(globalExchange, routeKey, convertedMessage.buffer, publishOptions);
        await channelContext.channel.waitForConfirms();

        $.emit(BunnyBus.PUBLISHED_EVENT, publishOptions, message);
    }

    async subscribe(queue, handlers, options) {

        const $S = $.subscriptions;

        if ($S.contains(queue)) {
            throw new Exceptions.SubscriptionExistError(queue);
        }

        if ($S.isBlocked(queue)) {
            throw new Exceptions.SubscriptionBlockedError(queue);
        }

        $S.create(queue, handlers, options);

        const queueOptions = options && options.queue ? options.queue : null;
        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const maxRetryCount = (options && options.maxRetryCount) || $.config.maxRetryCount;
        const validatePublisher = (options && options.hasOwnProperty('validatePublisher')) ? options.validatePublisher : $.config.validatePublisher;
        const validateVersion = (options && options.hasOwnProperty('validateVersion')) ? options.validateVersion : $.config.validateVersion;
        const disableQueueBind = (options && options.hasOwnProperty('disableQueueBind')) ? options.disableQueueBind : $.config.disableQueueBind;
        const rejectUnroutedMessages = (options && options.hasOwnProperty('rejectUnroutedMessages')) ? options.rejectUnroutedMessages : $.config.rejectUnroutedMessages;
        const meta = (options && options.meta);
        const channelName = BunnyBus.QUEUE_CHANNEL_NAME(queue);

        const channelContext = await $._autoBuildChannelContext(channelName, queue);

        await Promise.all([
            $.createQueue(queue, queueOptions),
            $.createExchange(globalExchange, 'topic', null)
        ]);

        if (!disableQueueBind) {
            await Promise.all(Object.keys(handlers).map((pattern) => channelContext.channel.bindQueue(queue, globalExchange, pattern)));
        }

        const result = await channelContext.channel.consume(
            queue,
            async (payload) => {

                if (payload) {
                    const parsedPayload = Helpers.parsePayload(payload);
                    const routeKey = Helpers.reduceRouteKey(payload, null, parsedPayload.message);
                    const currentRetryCount = payload.properties.headers.retryCount || -1;
                    const errorQueue = `${queue}_error`;
                    const matchedHandlers = Helpers.handlerMatcher(handlers, routeKey);

                    if (matchedHandlers.length > 0) {
                        // check for `bunnyBus` header first
                        if (validatePublisher && !(payload.properties && payload.properties.headers && payload.properties.headers.bunnyBus)) {
                            const reason = 'message not of BunnyBus origin';
                            $.logger.warn(reason);
                            await $._reject(payload, channelName, errorQueue, { reason });
                        }
                        // check for `bunnyBus`:<version> semver
                        else if (validatePublisher && validateVersion && !Helpers.isMajorCompatible(payload.properties.headers.bunnyBus)) {
                            const reason = `message came from older bunnyBus version (${payload.properties.headers.bunnyBus})`;
                            $.logger.warn(reason);
                            await $._reject(payload, channelName, errorQueue, { reason });
                        }
                        else if (currentRetryCount < maxRetryCount) {
                            matchedHandlers.forEach(async (matchedHandler) => {

                                $.emit(BunnyBus.MESSAGE_DISPATCHED_EVENT, parsedPayload.metaData, parsedPayload.message);
                                if (meta) {
                                    await matchedHandler(
                                        parsedPayload.message,
                                        parsedPayload.metaData,
                                        $._ack.bind(null, payload, channelName),
                                        $._reject.bind(null, payload, channelName, errorQueue),
                                        $._requeue.bind(null, payload, channelName, queue, { routeKey })
                                    );
                                }
                                else {
                                    await matchedHandler(
                                        parsedPayload.message,
                                        $._ack.bind(null, payload, channelName),
                                        $._reject.bind(null, payload, channelName, errorQueue),
                                        $._requeue.bind(null, payload, channelName, queue)
                                    );
                                }
                            });
                        }
                        else {
                            const reason = `message passed retry limit of ${maxRetryCount} for routeKey (${routeKey})`;
                            $.logger.warn(reason);
                            await $._reject(payload, channelName, errorQueue, { reason });
                        }
                    }
                    else {
                        const reason = `message consumed with no matching routeKey (${routeKey}) handler`;
                        $.logger.warn(reason);
                        if (rejectUnroutedMessages) {
                            await $._reject(payload, channelName, errorQueue, { reason });
                        }
                        else {
                            // acking this directly to channel so events don't fire
                            await channelContext.channel.ack(payload);
                        }
                    }
                }
            }
        );

        if (result && result.consumerTag) {
            $S.tag(queue, result.consumerTag);
            $.emit(BunnyBus.SUBSCRIBED_EVENT, queue);
        }
    }

    async unsubscribe(queue) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.QUEUE_CHANNEL_NAME(queue));

        const $S = $.subscriptions;

        if ($S.contains(queue)) {
            await channelContext.channel.cancel($S.get(queue).consumerTag);
            $S.clear(queue);
            $.emit(BunnyBus.UNSUBSCRIBED_EVENT, queue);
        }
    }

    //options to store calling module, queue name
    async _ack(payload, channelName, options) {

        const channelContext = await $._autoBuildChannelContext(channelName);

        await channelContext.channel.ack(payload);

        const parsedPayload = Helpers.parsePayload(payload);
        parsedPayload.metaData.headers.ackedAt = (new Date()).toISOString();

        $.emit(BunnyBus.MESSAGE_ACKED_EVENT, parsedPayload.metaData, parsedPayload.message);
    }

    async _requeue(payload, channelName, queue, options) {

        const channelContext = await $._autoBuildChannelContext(channelName);

        const routeKey = Helpers.reduceRouteKey(payload, options);

        const headers = {
            transactionId : payload.properties.headers.transactionId,
            isBuffer      : payload.properties.headers.isBuffer,
            source        : payload.properties.headers.source,
            createdAt     : payload.properties.headers.createdAt,
            requeuedAt    : (new Date()).toISOString(),
            retryCount    : payload.properties.headers.retryCount || 0,
            bunnyBus      : Helpers.getPackageData().version,
            routeKey
        };
        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        ++sendOptions.headers.retryCount;

        await channelContext.channel.sendToQueue(queue, payload.content, sendOptions);
        await channelContext.channel.waitForConfirms();
        await channelContext.channel.ack(payload);

        const parsedPayload = Helpers.parsePayload(payload);
        parsedPayload.metaData.headers = Object.assign(parsedPayload.metaData.headers, headers);

        $.emit(BunnyBus.MESSAGE_REQUEUED_EVENT, parsedPayload.metaData, parsedPayload.message);
    }

    async _reject(payload, channelName, errorQueue, options) {

        const channelContext = await $._autoBuildChannelContext(channelName);

        const queue = errorQueue || $.config.server.errorQueue;

        const headers = {
            transactionId : payload.properties.headers.transactionId,
            isBuffer      : payload.properties.headers.isBuffer,
            source        : payload.properties.headers.source,
            createdAt     : payload.properties.headers.createdAt,
            requeuedAt    : payload.properties.headers.requeuedAt,
            erroredAt     : (new Date()).toISOString(),
            retryCount    : payload.properties.headers.retryCount || 0,
            bunnyBus      : Helpers.getPackageData().version,
            reason        : (options && options.reason)
        };

        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await $.createQueue(queue);
        await channelContext.channel.sendToQueue(queue, payload.content, sendOptions);
        await channelContext.channel.waitForConfirms();
        await channelContext.channel.ack(payload);

        const parsedPayload = Helpers.parsePayload(payload);
        parsedPayload.metaData.headers = Object.assign(parsedPayload.metaData.headers, headers);

        $.emit(BunnyBus.MESSAGE_REJECTED_EVENT, parsedPayload.metaData, parsedPayload.message);
    }

    async _autoBuildChannelContext(channelName, queue = null) {

        let connectionContext = undefined;
        let channelContext = $.channels.get(channelName);

        if (channelContext && channelContext.channel && channelContext.connectionContext.connection) {
            return channelContext;
        }

        connectionContext = await $.connections.create(BunnyBus.DEFAULT_CONNECTION_NAME, $.config);
        connectionContext
            .removeListener(ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT, internals.handlers[ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT])
            .on(ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT, internals.handlers[ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT])
            .removeListener(ConnectionManager.AMQP_CONNECTION_ERROR_EVENT, internals.handlers[ConnectionManager.AMQP_CONNECTION_ERROR_EVENT])
            .on(ConnectionManager.AMQP_CONNECTION_ERROR_EVENT, internals.handlers[ConnectionManager.AMQP_CONNECTION_ERROR_EVENT]);
        channelContext = await $.channels.create(channelName, queue, connectionContext, $.config);
        channelContext
            .removeListener(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, internals.handlers[ChannelManager.AMQP_CHANNEL_CLOSE_EVENT])
            .on(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, internals.handlers[ChannelManager.AMQP_CHANNEL_CLOSE_EVENT])
            .removeListener(ChannelManager.AMQP_CHANNEL_ERROR_EVENT, internals.handlers[ChannelManager.AMQP_CHANNEL_ERROR_EVENT])
            .on(ChannelManager.AMQP_CHANNEL_ERROR_EVENT, internals.handlers[ChannelManager.AMQP_CHANNEL_ERROR_EVENT]);

        return channelContext;
    }

    async _recoverConnection() {

        for (const { name, queue } of $.channels.list()) {
            if (queue) {
                await $._recoverChannel(name);
            }
        }
    }

    async _recoverChannel(channelName) {

        if (!$._state.recoveryLock) {

            $._state.recoveryLock = true;

            try {
                const { queue } = $.channels.get(channelName);

                if (queue && $.subscriptions.contains(queue, false)) {
                    const { handlers, options } = $.subscriptions.get(queue);

                    if (!$.subscriptions.isBlocked(queue)) {
                        $.subscriptions.clear(queue);
                        await $.subscribe(queue, handlers, options);
                    }
                }
            }
            catch (err) {
                err.bunnyBusMessage = 'failed to recover, exiting process';
                $.logger.fatal(err);
                $.emit(BunnyBus.RECOVERY_FAILED_EVENT, err);
                throw err;
            }
            finally {
                $._state.recoveryLock = false;
            }
        }
    }
}

internals.handlers[SubscriptionManager.BLOCKED_EVENT] = async (queue) => {

    $.logger.info(`blocking queue ${queue}`);

    try {
        await $.unsubscribe(queue);
    }
    catch (err) {
        err.bunnyBusMessage = 'blocked event handling failed';
        $.logger.error(err);
    }
};

internals.handlers[SubscriptionManager.UNBLOCKED_EVENT] = async (queue) => {

    const subscription = $._subscriptions.get(queue);

    $.logger.info(`unblocking queue ${queue}`);

    try {
        await $.subscribe(queue, subscription.handlers, subscription.options);
    }
    catch (err) {
        err.bunnyBusMessage = 'unblocked event handling failed';
        $.logger.error(err);
    }
};

internals.handlers[ConnectionManager.AMQP_CONNECTION_ERROR_EVENT] = (err, context) => {

    err.bunnyBusMessage = 'connection error';
    err.context = context;
    $.logger.error(err);
};

internals.handlers[ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT] = async (context) => {

    $.logger.info(`${context.name} connection closed`);

    try {
        $.emit(BunnyBus.RECOVERING_CONNECTION_EVENT, context.name);
        await $._recoverConnection();
        $.emit(BunnyBus.RECOVERED_CONNECTION_EVENT, context.name);
    }
    catch (err) {}
};

internals.handlers[ChannelManager.AMQP_CHANNEL_ERROR_EVENT] = (err, context) => {

    err.bunnyBusMessage = 'channel errored';
    err.context = context;
    $.logger.error(err);
};

internals.handlers[ChannelManager.AMQP_CHANNEL_CLOSE_EVENT] = async (context) => {

    $.logger.info(`${context.name} channel closed`);

    try {
        $.emit(BunnyBus.RECOVERING_CHANNEL_EVENT, context.name);
        await $._recoverChannel(context.name);
        $.emit(BunnyBus.RECOVERED_CHANNEL_EVENT, context.name);
    }
    catch (err) {}
};

module.exports = BunnyBus;
