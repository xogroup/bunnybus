'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Events = require('./events');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const { ChannelManager, ConnectionManager, SubscriptionManager } = require('./states');
const EventLogger = require('./loggers').EventLogger;

const AMQP_CONNECTION_ERROR_EVENT = 'error';
const AMQP_CONNECTION_CLOSE_EVENT = 'close';
const AMQP_CHANNEL_ERROR_EVENT = 'error';
const AMQP_CHANNEL_CLOSE_EVENT = 'close';
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
                recovery            : false,
                activeConnection    : false,
                activeChannel       : false,
                connectionSemaphore : false,
                channelSemaphore    : false
            };

            $.logger = new EventLogger($);
            $.promise = Promise;
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

    static get DEFAULT_CONNECTION_NAME() {

        return 'default';
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

        if (Helpers.validateLoggerContract(value)) {
            $._logger = value;
        }
    }

    get promise() {

        return $._promise;
    }

    set promise(value) {

        if (Helpers.validatePromiseContract(value)) {
            $._promise = value;
        }
    }

    get connectionString() {

        return Helpers.createConnectionString($.config);
    }

    get connection() {

        return $._connection;
    }

    set connection(value) {

        if (value) {
            value.on(AMQP_CONNECTION_ERROR_EVENT, internals.handlers[BunnyBus.AMQP_CONNECTION_ERROR_EVENT]);
            value.on(AMQP_CONNECTION_CLOSE_EVENT, internals.handlers[BunnyBus.AMQP_CONNECTION_CLOSE_EVENT]);
        }

        $._connection = value;
    }

    get hasConnection() {

        return $._connection ? true : false;
    }

    get channel() {

        return $._channel;
    }

    set channel(value) {

        if (value) {
            value.on(AMQP_CHANNEL_ERROR_EVENT, internals.handlers[BunnyBus.AMQP_CHANNEL_ERROR_EVENT]);
            value.on(AMQP_CHANNEL_CLOSE_EVENT, internals.handlers[BunnyBus.AMQP_CHANNEL_CLOSE_EVENT]);
        }

        $._channel = value;
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

            channelContext.once(Events.AMQP_CHANNEL_CLOSE_EVENT, resolve);
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

    async deleteQueue(name, options) {

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        return await channelContext.channel.deleteQueue(name, options);
    }

    async checkQueue(name) {

        let result = false;

        const channelContext = await $._autoBuildChannelContext(BunnyBus.MANAGEMENT_CHANNEL_NAME());

        const promise = new Promise((resolve) => {

            channelContext.once(Events.AMQP_CHANNEL_CLOSE_EVENT, resolve);
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
            $._autoBuildChannelContext(BunnyBus.QUEUE_CHANNEL_NAME(queue)),
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

        const channelContext = await $._autoBuildChannelContext(BunnyBus.QUEUE_CHANNEL_NAME(queue));

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
        const meta = (options && options.meta);
        const channelName = BunnyBus.QUEUE_CHANNEL_NAME(queue);

        const channelContext = await $._autoBuildChannelContext(channelName);

        await Promise.all([
            $.createQueue(queue, queueOptions),
            $.createExchange(globalExchange, 'topic', null)
        ]);

        await Promise.all(Object.keys(handlers).map((pattern) => channelContext.channel.bindQueue(queue, globalExchange, pattern)));

        const result = await channelContext.channel.consume(
            queue,
            (payload) => {

                if (payload) {
                    const parsedPayload = Helpers.parsePayload(payload);
                    const routeKey = Helpers.reduceRouteKey(payload, null, parsedPayload.message);
                    const currentRetryCount = payload.properties.headers.retryCount || -1;
                    const errorQueue = `${queue}_error`;
                    const matchedHandlers = Helpers.handlerMatcher(handlers, routeKey);

                    if (matchedHandlers.length > 0) {
                        // check for `bunnyBus` header first
                        if (validatePublisher && !(payload.properties && payload.properties.headers && payload.properties.headers.bunnyBus)) {
                            $.logger.warn('message not of BunnyBus origin');
                            // should reject with error
                            $._reject(payload, channelName, errorQueue);
                        }
                        // check for `bunnyBus`:<version> semver
                        else if (validatePublisher && validateVersion && !Helpers.isMajorCompatible(payload.properties.headers.bunnyBus)) {
                            $.logger.warn(`message came from older bunnyBus version (${payload.properties.headers.bunnyBus})`);
                            // should reject with error
                            $._reject(payload, channelName, errorQueue);
                        }
                        else if (currentRetryCount < maxRetryCount) {
                            matchedHandlers.forEach((matchedHandler) => {

                                if (meta) {
                                    matchedHandler(
                                        parsedPayload.message,
                                        parsedPayload.metaData,
                                        $._ack.bind(null, payload, channelName),
                                        $._reject.bind(null, payload, channelName, errorQueue),
                                        $._requeue.bind(null, payload, channelName, queue, { routeKey })
                                    );
                                }
                                else {
                                    matchedHandler(
                                        parsedPayload.message,
                                        $._ack.bind(null, payload, channelName),
                                        $._reject.bind(null, payload, channelName, errorQueue),
                                        $._requeue.bind(null, payload, channelName, queue)
                                    );
                                }
                            });
                        }
                        else {
                            $.logger.warn(`message passed retry limit of ${maxRetryCount} for routeKey (${routeKey})`);
                            // should reject with error
                            $._reject(payload, channelName, errorQueue);
                        }
                    }
                    else {
                        $.logger.warn(`message consumed with no matching routeKey (${routeKey}) handler`);
                        channelContext.channel.ack(payload);
                    }
                }
            }
        );

        if (result && result.consumerTag) {
            $S.tag(queue, result.consumerTag);
            $.emit(BunnyBus.SUBSCRIBED_EVENT, queue);
        }
    }

    _resubscribeAll(cb) {

        const $S = $.subscriptions;
        const subscribeFunctions = [];
        for ( const [queueName, values] of $S._subscriptions ) {
            if (!$S.isBlocked(queueName)) {
                subscribeFunctions.push( $._subscribe.bind(this, queueName, values.handlers, values.options));
                $S.clear(queueName);
            }
        }

        return Async.series(subscribeFunctions, cb);
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

        //should reject after max retry count is reached.
        await channelContext.channel.sendToQueue(queue, payload.content, sendOptions);
        await channelContext.channel.waitForConfirms();
        await channelContext.channel.ack(payload);
    }

    async _reject(payload, channelName, errorQueue, options) {

        const channelContext = await $._autoBuildChannelContext(channelName);

        const queue = errorQueue || $.config.server.errorQueue;

        //implement error reasion
        const headers = {
            transactionId : payload.properties.headers.transactionId,
            isBuffer      : payload.properties.headers.isBuffer,
            source        : payload.properties.headers.source,
            createdAt     : payload.properties.headers.createdAt,
            requeuedAt    : payload.properties.headers.requeuedAt,
            erroredAt     : (new Date()).toISOString(),
            retryCount    : payload.properties.headers.retryCount || 0,
            bunnyBus      : Helpers.getPackageData().version
        };

        const sendOptions = Helpers.buildPublishOrSendOptions(options, headers);

        await $.createQueue(queue);
        await channelContext.channel.sendToQueue(queue, payload.content, sendOptions);
        await channelContext.channel.waitForConfirms();
        await channelContext.channel.ack(payload);
    }

    async _autoBuildChannelContext(channelName) {

        let connectionContext = undefined;
        let channelContext = $.channels.get(channelName);

        if (channelContext && channelContext.channel && channelContext.connectionContext.connection) {
            return channelContext;
        }

        connectionContext = await $.connections.create(BunnyBus.DEFAULT_CONNECTION_NAME, $.config);
        channelContext = await $.channels.create(channelName, connectionContext, $.config);

        return channelContext;
    }

    _recoverConnectChannel() {

        $._state.recovery = true;

        $.emit(BunnyBus.RECOVERING_EVENT);

        $._autoConnectChannel((err) => {

            if (err) {
                $.logger.fatal('failed to recover, exiting process');
                return process.exit(1);
            }

            return $._resubscribeAll((err) => {

                if (err) {
                    $.logger.fatal('failed to recover, exiting process');
                    return process.exit(1);
                }

                $._state.recovery = false;
                $.emit(BunnyBus.RECOVERED_EVENT);
            });
        });
    }
}

internals.handlers[SubscriptionManager.BLOCKED_EVENT] = async (queue) => {

    $.logger.info(`blocking queue ${queue}`);

    try {
        await $.unsubscribe(queue);
    }
    catch (err) {
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
        $.logger.error(err);
    }
};

internals.handlers[BunnyBus.AMQP_CONNECTION_ERROR_EVENT] = (err) => {

    $.emit(BunnyBus.AMQP_CONNECTION_ERROR_EVENT, err);
    $.logger.error('connection errored', err);
};

internals.handlers[BunnyBus.AMQP_CONNECTION_CLOSE_EVENT] = (err) => {

    $.logger.info('connection closed', err);
    const rebuildConnection = $._state.activeConnection;
    $.connection = null;
    $.emit(BunnyBus.AMQP_CONNECTION_CLOSE_EVENT, err);

    if (rebuildConnection) {
        $._recoverConnectChannel();
    }
};

internals.handlers[BunnyBus.AMQP_CHANNEL_ERROR_EVENT] = (err) => {

    $.emit(BunnyBus.AMQP_CHANNEL_ERROR_EVENT, err);
    $.logger.error('channel errored', err);
};

internals.handlers[BunnyBus.AMQP_CHANNEL_CLOSE_EVENT] = (err) => {

    $.logger.info('channel closed', err);
    const rebuildChannel = $._state.activeChannel && $._state.activeConnection;
    $.channel = null; //we assume our channel is in fact dead
    $.emit(BunnyBus.AMQP_CHANNEL_CLOSE_EVENT, err);

    if (rebuildChannel) {
        $._recoverConnectChannel();
    }
};

module.exports = BunnyBus;
