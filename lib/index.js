'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const SubscriptionManager = require('./states').SubscriptionManager;
const EventLogger = require('./loggers').EventLogger;
const AMQP_CONNECTION_ERROR_EVENT = 'error';
const AMQP_CONNECTION_CLOSE_EVENT = 'close';
const AMQP_CHANNEL_ERROR_EVENT = 'error';
const AMQP_CHANNEL_CLOSE_EVENT = 'close';
const internals = {
    handlers : {}
};

const buildPublishOrSendOptions = (options, headers) => {

    const SEND_OR_PUBLISH_OPTION_KEYS = [
        'expiration',
        'userId',
        'CC',
        'priority',
        'persistent',
        'deliveryMode',
        'mandatory',
        'BCC',
        'immediate',
        'contentType',
        'contentEncoding',
        'correlationId',
        'replyTo',
        'messageId',
        'timestamp',
        'type',
        'appId'
    ];

    const sendOrPublishOptions = {
        headers
    };

    SEND_OR_PUBLISH_OPTION_KEYS.forEach((whitelistedOption) => {

        if (options[whitelistedOption]){
            sendOrPublishOptions[whitelistedOption] = options[whitelistedOption];
        }
    });

    console.log('sendOrPublishOptions ::: \n', sendOrPublishOptions);

    return sendOrPublishOptions;
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

        return $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {

        $._config = Object.assign({}, $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION, value);
    }

    get subscriptions() {

        return $._subscriptions;
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

    get hasChannel() {

        return $.channel ? true : false;
    }

    createExchange(name, type, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._createExchange, name, type, options);
        }

        $._createExchange(name, type, options, callback);
    }

    _createExchange(name, type, options, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            //type : (direct, fanout, header, topic)
            $.channel.assertExchange(name, type, Object.assign({}, BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION, options), callback);
        }
    }

    deleteExchange(name, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._deleteExchange, name, options);
        }

        $._deleteExchange(name, options, callback);
    }

    _deleteExchange(name, options, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.deleteExchange(name, options, callback);
        }
    }

    checkExchange(name, callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._checkExchange, name);
        }

        $._checkExchange(name, callback);
    }

    _checkExchange(name, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.checkExchange(name, callback);
        }
    }

    //callback returns results
    //
    createQueue(name, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._createQueue, name, options);
        }

        $._createQueue(name, options, callback);
    }

    _createQueue(name, options, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.assertQueue(name, Object.assign({}, BunnyBus.DEFAULT_QUEUE_CONFIGURATION, options), callback);
        }
    }

    deleteQueue(name, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._deleteQueue, name, options);
        }

        $._deleteQueue(name, options, callback);
    }

    _deleteQueue(name, options, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.deleteQueue(name, options, callback);
        }
    }

    checkQueue(name, callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._checkQueue, name);
        }

        $._checkQueue(name, callback);
    }

    _checkQueue(name, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.checkQueue(name, callback);
        }
    }

    send(message, queue, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._send, message, queue, options);
        }

        $._send(message, queue, options, callback);
    }

    _send(message, queue, options, callback) {

        const routeKey = Helpers.reduceRouteKey(null, options, message);
        const source = (options && options.source);

        Async.auto({
            initialize           : (cb) => $._autoConnectChannel(cb),
            convert_message      : (cb) => Helpers.convertToBuffer(message, cb),
            create_transaction_id: (cb) => {

                if (options && options.transactionId) {
                    cb(null, options.transactionId);
                }
                else {
                    Helpers.createTransactionId(cb);
                }
            },
            create_queue         : ['initialize', (results, cb) => $.createQueue(queue, null, cb)],
            send                 : ['create_queue', (results, cb) => {

                const sendOptions = {
                    headers : {
                        transactionId : results.create_transaction_id,
                        isBuffer      : results.convert_message.buffer.isBuffer,
                        source,
                        routeKey,
                        createdAt     : (new Date()).toISOString(),
                        bunnyBus      : Helpers.getPackageData().version
                    }
                };

                $.channel.sendToQueue(queue, results.convert_message.buffer, sendOptions, cb);
            }],
            wait                 : ['send', (results, cb) => {

                $.channel.waitForConfirms(cb);
            }]
        }, (err) => callback(err));
    }

    get(queue, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._get, queue, options);
        }

        $._get(queue, options, callback);
    }

    _get(queue, options, callback) {

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.get(queue, options, callback);
        }
    }

    getAll(queue, handler, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._getAll, queue, handler, options);
        }

        $._getAll(queue, handler, options, callback);
    }

    _getAll(queue, handler, options, callback) {

        const getOptions = (options && options.get);
        const meta = (options && options.meta);

        let endUntil = false;

        Async.until(
            () => endUntil,
            (cb) => {

                $.get(queue, getOptions, (err, payload) => {

                    if (payload) {
                        $.logger.trace(payload);

                        const parsedPayload = Helpers.parsePayload(payload);

                        if (meta) {
                            handler(
                                parsedPayload.message,
                                parsedPayload.metaData,
                                $._ack.bind(null, payload)
                            );
                        }
                        else {
                            handler(
                                parsedPayload.message,
                                $._ack.bind(null, payload)
                            );
                        }
                    }
                    else {
                        endUntil = true;
                    }
                    cb(err);
                });
            },
            (err) => callback(err)
        );
    }

    publish(message, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._publish, message, options);
        }

        $._publish(message, options, callback);
    }

    _publish(message, options, callback) {

        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const routeKey = Helpers.reduceRouteKey(null, options, message);
        const source = (options && options.source);

        if (!routeKey) {
            callback(new Exceptions.NoRouteKeyError());
            return;
        }

        Async.auto({
            initialize           : (cb) => $._autoConnectChannel(cb),
            convert_message      : (cb) => Helpers.convertToBuffer(message, cb),
            create_transaction_id: (cb) => {

                if (options && options.transactionId) {
                    cb(null, options.transactionId);
                }
                else {
                    Helpers.createTransactionId(cb);
                }
            },
            create_exchange      : ['initialize', (results, cb) => $.createExchange(globalExchange, 'topic', null, cb)],
            publish              : ['create_exchange', (results, cb) => {
                const headers = {
                    transactionId : results.create_transaction_id,
                    isBuffer      : results.convert_message.isBuffer,
                    source,
                    routeKey,
                    createdAt     : (new Date()).toISOString(),
                    bunnyBus      : Helpers.getPackageData().version
                };
                const publishOptions = buildPublishOrSendOptions(options, headers);

                $.channel.publish(globalExchange, routeKey, results.convert_message.buffer, publishOptions, cb);
            }],
            wait                  : ['publish', (results, cb) => {

                $.channel.waitForConfirms(cb);
            }]
        }, (err) => {

            callback(err);

            if (!err) {

                $.emit(BunnyBus.PUBLISHED_EVENT, message);
            }
        });
    }

    subscribe(queue, handlers, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._subscribe, queue, handlers, options);
        }

        $._subscribe(queue, handlers, options, callback);
    }

    _subscribe(queue, handlers, options, callback) {

        const $S = $.subscriptions;

        if ($S.contains(queue)) {
            callback(new Exceptions.SubscriptionExistError(queue));
            return;
        }

        $S.create(queue, handlers, options);

        const queueOptions = options && options.queue ? options.queue : null;
        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const maxRetryCount = (options && options.maxRetryCount) || $.config.maxRetryCount;
        const validatePublisher = (options && options.hasOwnProperty('validatePublisher')) ? options.validatePublisher : $.config.validatePublisher;
        const validateVersion = (options && options.hasOwnProperty('validateVersion')) ? options.validateVersion : $.config.validateVersion;
        const meta = (options && options.meta);

        Async.auto({
            initialize      : $._autoConnectChannel,
            create_queue   : ['initialize', (results, cb) => $.createQueue(queue, queueOptions, cb)],
            create_exchange: ['initialize', (results, cb) => $.createExchange(globalExchange, 'topic', null, cb)],
            bind_routes    : ['create_queue', 'create_exchange', (results, cb) => {

                Async.mapValues(
                    handlers,
                    (handler, pattern, mapCB) => {

                        $.channel.bindQueue(queue, globalExchange, pattern, null, mapCB);
                    },
                    cb
                );
            }],
            setup_consumer : ['create_queue', (results, cb) => {

                if ($S.isBlocked(queue)) {
                    return cb(new Exceptions.SubscriptionBlockedError(queue));
                }

                $.channel.consume(
                    queue,
                    (payload) => {

                        if (payload) {
                            $.logger.trace(payload);

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
                                    $._reject(payload, errorQueue);
                                }
                                // check for `bunnyBus`:<version> semver
                                else if (validatePublisher && validateVersion && !Helpers.isMajorCompatible(payload.properties.headers.bunnyBus)) {
                                    $.logger.warn(`message came from older bunnyBus version (${payload.properties.headers.bunnyBus})`);
                                    // should reject with error
                                    $._reject(payload, errorQueue);
                                }
                                else if (currentRetryCount < maxRetryCount) {
                                    matchedHandlers.forEach((matchedHandler) => {

                                        if (meta) {
                                            matchedHandler(
                                                parsedPayload.message,
                                                parsedPayload.metaData,
                                                $._ack.bind(null, payload),
                                                $._reject.bind(null, payload, errorQueue),
                                                $._requeue.bind(null, payload, queue, { routeKey })
                                            );
                                        }
                                        else {
                                            matchedHandler(
                                                parsedPayload.message,
                                                $._ack.bind(null, payload),
                                                $._reject.bind(null, payload, errorQueue),
                                                $._requeue.bind(null, payload, queue)
                                            );
                                        }
                                    });
                                }
                                else {
                                    $.logger.warn(`message passed retry limit of ${maxRetryCount} for routeKey (${routeKey})`);
                                    // should reject with error
                                    $._reject(payload, errorQueue);
                                }
                            }
                            else {
                                $.logger.warn(`message consumed with no matching routeKey (${routeKey}) handler`);
                                $.channel.ack(payload);
                            }
                        }
                    },
                    null,
                    (err, result) => {

                        if (!err && (result && result.consumerTag)) {
                            $S.tag(queue, result.consumerTag);
                        }

                        return cb(err);
                    });
            }]
        }, (err) => {

            if (!err) {
                $.emit(BunnyBus.SUBSCRIBED_EVENT, queue);
            }

            return callback(err);
        });
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

    unsubscribe(queue, callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._unsubscribe, queue);
        }

        $._unsubscribe(queue, callback);
    }

    _unsubscribe(queue, callback) {

        const $S = $.subscriptions;

        if ($S.contains(queue)) {
            $.channel.cancel($S.get(queue).consumerTag, (err) => {

                $S.clear(queue);

                callback(err);

                if (!err) {
                    $.emit(BunnyBus.UNSUBSCRIBED_EVENT, queue);
                }
            });
        }
        else {
            callback();
        }
    }

    //options to store calling module, queue name
    _ack(payload, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._ack, payload, options);
        }

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.ack(payload);
            callback();
        }
    }

    _requeue(payload, queue, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._requeue, payload, queue, options);
        }

        const routeKey = Helpers.reduceRouteKey(payload, options);

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
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
            const sendOptions = buildPublishOrSendOptions(options, headers);

            ++sendOptions.headers.retryCount;

            //should reject after max retry count is reached.
            Async.waterfall([
                (cb) => $.channel.sendToQueue(queue, payload.content, sendOptions, cb),
                (cb) => $.channel.waitForConfirms(cb),
                (cb) => $._ack(payload, null, cb)
            ], callback);
        }
    }

    _reject(payload, errorQueue, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._reject, payload, errorQueue, options);
        }

        const queue = errorQueue || $.config.server.errorQueue;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            //implement error reasion
            const sendOptions = {
                headers : {
                    transactionId : payload.properties.headers.transactionId,
                    isBuffer      : payload.properties.headers.isBuffer,
                    source        : payload.properties.headers.source,
                    createdAt     : payload.properties.headers.createdAt,
                    requeuedAt    : payload.properties.headers.requeuedAt,
                    erroredAt     : (new Date()).toISOString(),
                    retryCount    : payload.properties.headers.retryCount || 0,
                    bunnyBus      : Helpers.getPackageData().version
                }
            };

            Async.waterfall([
                (cb) => $.createQueue(queue, null, cb),
                (result, cb) => $.channel.sendToQueue(queue, payload.content, sendOptions, cb),
                (cb) => $.channel.waitForConfirms(cb),
                (cb) => $._ack(payload, null, cb)
            ], callback);
        }
    }

    _autoConnectChannel(callback) {

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._autoConnectChannel);
        }

        if ($.hasConnection && $.hasChannel) {
            return callback();
        }

        return Async.waterfall([
            $._createConnection,
            $._createChannel
        ], callback);
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

    _createConnection(callback)  {

        $._state.activeConnection = true;
        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._createConnection);
        }

        if ($.hasConnection) {
            return callback(null);
        }

        if ($._state.connectionSemaphore) {
            $._state.connectionCallbacks.push(callback);
            return;
        }

        $._state.connectionCallbacks = [];
        $._state.connectionSemaphore = true;

        Async.retry({
            times: 100,
            interval: Helpers.exponentialBackoff,
            errorFilter: (err) => {

                if (err.code && err.code === 'ENOTFOUND') {
                    return false;
                }
                return true;
            }
        }, (retryCB) => {

            return Async.timeout(Amqp.connect,$.config.timeout)($.connectionString, retryCB);
        }, (err, connection) => {

            $._state.connectionSemaphore = false;

            if (!err) {
                $.connection = connection;
            }

            $._state.connectionCallbacks.forEach( (subCB) => {

                return subCB(err);
            });

            return callback(err);
        });
    }

    _closeConnection(callback) {

        $._state.activeConnection = false;

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._closeConnection);
        }

        Async.waterfall([
            $._closeChannel,
            (cb) => {

                if ($.hasConnection) {

                    $.connection.close(() => {

                        return cb(null);
                    });
                }
                else {
                    cb();
                }
            }
        ], (err) => {

            if (!err) {
                $.connection = null;
            }

            callback(err);
        });
    }

    _createChannel(callback) {

        $._state.activeChannel = true;

        callback = Helpers.reduceCallback(callback);
        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._createChannel);
        }

        if (!$.hasConnection) {
            return callback(new Exceptions.NoConnectionError());
        }

        if ($.hasChannel) {
            return callback();
        }

        if ($._state.channelSemaphore) {
            $._state.channelCallbacks.push(callback);
            return;
        }

        $._state.channelCallbacks = [];
        $._state.channelSemaphore = true;
        $.subscriptions.clearAll();

        return Async.retry({
            times: 100,
            interval: Helpers.exponentialBackoff
        }, (retryCB) => {

            return Async.waterfall([
                (cb) => {

                    return $.connection.createConfirmChannel(cb);
                },
                (channel, cb) => {

                    $.channel = channel;
                    return $.channel.prefetch($._config.prefetch, null, cb);
                }
            ], retryCB);
        }, (err) => {

            $._state.channelSemaphore = false;

            if (err) {
                $.channel = null;
                $._state.activeChannel = false;
            }

            $._state.channelCallbacks.forEach( (subCB) => {

                return subCB(err);
            });

            return callback(err);
        });
    }

    _closeChannel(callback) {

        $._state.activeChannel = false;

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._closeChannel);
        }

        if ($.hasChannel) {
            $.channel.close(() => {

                $.channel = null;
                callback(null);
            });
        }
        else {
            callback();
        }
    }
}

internals.handlers[SubscriptionManager.BLOCKED_EVENT] = (queue) => {

    $.logger.info(`blocking queue ${queue}`);
    $.unsubscribe(queue, (err) => {

        if (err) {
            $.logger.error(err);
        }
    });
};

internals.handlers[SubscriptionManager.UNBLOCKED_EVENT] = (queue) => {

    const subscription = $._subscriptions.get(queue);

    $.logger.info(`unblocking queue ${queue}`);
    $.subscribe(queue, subscription.handlers, subscription.options, (err) => {

        if (err) {
            $.logger.error(err);
        }
    });
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
