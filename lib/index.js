'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const SubscriptionManager = require('./states').SubscriptionManager;
const EventLogger = require('./loggers').EventLogger;
const AMQP_CONNECTION_ERROR_EVENT = 'error';
const AMQP_CHANNEL_ERROR_EVENT = 'error';
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
                recovery      : false,
                exchanges     : [], // { name }
                queues        : []  // { name }
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

    static get AMQP_CHANNEL_ERROR_EVENT() {

        return 'amqp.channel.error';
    }

    get config() {

        return $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {
//TODO need to destroy state and reevaluate when this happens
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

        return Helpers.createConnectionString($._config);
    }

    get connection() {

        return $._connection;
    }

    set connection(value) {

        if (value) {
            value.on(AMQP_CONNECTION_ERROR_EVENT, internals.handlers[BunnyBus.AMQP_CONNECTION_ERROR_EVENT]);
        }

        $._connection = value;
    }

    get hasConnection() {

        return $.connection ? true : false;
    }

    get channel() {

        return $._channel;
    }

    set channel(value) {

        if (value) {
            value.on(AMQP_CHANNEL_ERROR_EVENT, internals.handlers[BunnyBus.AMQP_CHANNEL_ERROR_EVENT]);
        }

        $._channel = value;
    }

    get hasChannel() {

        return $.channel ? true : false;
    }

    createExchange(name, type, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.createExchange, name, type, options);
        }

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
            return Helpers.toPromise($.promise, $.deleteExchange, name, options);
        }

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
            return Helpers.toPromise($.promise, $.checkExchange, name);
        }

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
            return Helpers.toPromise($.promise, $.createQueue, name, options);
        }

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
            return Helpers.toPromise($.promise, $.deleteQueue, name, options);
        }

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
            return Helpers.toPromise($.promise, $.checkQueue, name);
        }

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
            return Helpers.toPromise($.promise, $.send, message, queue, options);
        }

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
                        createdAt     : (new Date()).toISOString()
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
            return Helpers.toPromise($.promise, $.get, queue, options);
        }

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.get(queue, options, callback);
        }
    }

    publish(message, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.publish, message, options);
        }

        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const routeKey = (options && options.routeKey) || (message && message.event);
        //rename source to source
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
            //cache the exchange
            create_exchange      : ['initialize', (results, cb) => $.createExchange(globalExchange, 'topic', null, cb)],
            publish              : ['create_exchange', (results, cb) => {

                const publishOptions = {
                    headers: {
                        transactionId : results.create_transaction_id,
                        isBuffer      : results.convert_message.isBuffer,
                        source,
                        routeKey,
                        createdAt     : (new Date()).toISOString()
                    }
                };

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

    ///
    /// options : not amqp
    ///
    subscribe(queue, handlers, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.subscribe, queue, handlers, options);
        }

        const $S = $.subscriptions;

        if ($S.contains(queue)) {
            callback(new Exceptions.SubscriptionExistError(queue));
            return;
        }

        $S.create(queue, handlers, options);

        const queueOptions = options && options.queue ? options.queue : null;
        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const maxRetryCount = (options && options.maxRetryCount) || $.config.maxRetryCount;

        Async.auto({
            initialize      : $._autoConnectChannel,
            //cache the queue
            create_queue   : ['initialize', (results, cb) => $.createQueue(queue, queueOptions, cb)],
            //cache the exchange
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

                        const message = payload.properties.headers.isBuffer ? payload.content : JSON.parse(payload.content.toString());
                        const routeKey = payload.properties.headers.routeKey || message.event || payload.fields.routingKey;
                        const currentRetryCount = payload.properties.headers.retryCount || -1;
                        const errorQueue = `${queue}_error`;
                        //should put this in the publish func()
                        // var routeKey = isValidRoute(payload.fields.routingKey) || isValidRoute(message.event);

                        if (handlers.hasOwnProperty(routeKey)) {
                            if (currentRetryCount < maxRetryCount) {
                                handlers[routeKey](
                                    message,
                                    $._ack.bind(null, payload),
                                    $._reject.bind(null, payload, errorQueue),
                                    $._requeue.bind(null, payload, queue, { routeKey })
                                );
                            }
                            else {
                                $._reject(payload, errorQueue);
                            }
                        }
                        else {
                            $.channel.ack(payload);
                        }
                    },
                    null,
                    (err, result) => {

                        $S.tag(queue, result.consumerTag);

                        cb(err);
                    });
            }]
        }, (err) => {

            callback(err);

            if (!err) {
                $.emit(BunnyBus.SUBSCRIBED_EVENT, queue);
            }
        });
    }

    unsubscribe(queue, callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.unsubscribe, queue);
        }

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

        const routeKey = options && options.routeKey ? options.routeKey : null;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            const sendOptions = {
                headers : {
                    transactionId : payload.properties.headers.transactionId,
                    isBuffer      : payload.properties.headers.isBuffer,
                    source : payload.properties.headers.source,
                    createAt      : payload.properties.headers.createdAt,
                    requeuedAt    : (new Date()).toISOString(),
                    retryCount    : payload.properties.headers.retryCount || 0,
                    routeKey
                }
            };

            ++sendOptions.headers.retryCount;

            //should reject after max retry count is reached.
            Async.waterfall([
                (cb) => $.channel.sendToQueue(queue, payload.content, sendOptions, cb),
                (cb) => $.channel.waitForConfirms(cb),
                (cb) => $._ack(payload, null, cb)
            ], callback);
        }
    }

//options to store calling module, queue name, error queue name
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
                    source : payload.properties.headers.source,
                    createAt      : payload.properties.headers.createdAt,
                    requeuedAt    : payload.properties.headers.requeuedAt,
                    errorAt       : (new Date()).toISOString(),
                    retryCount    : payload.properties.headers.retryCount || 0
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

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._autoConnectChannel);
        }

        if ($.hasConnection && $.hasChannel) {
            callback();
        }
        else {
            Async.waterfall([
                $._createConnection,
                $._createChannel
            ], callback);
        }
    }

    _recoverConnectChannel() {

        $._state.recovery = true;

        $.emit(BunnyBus.RECOVERING_EVENT);

        Async.retry({
            times   : 240,
            interval: 15000
        },
        (cb) => $._autoConnectChannel(cb),
        (err) => {

            if (err) {
                process.exit(1);
            }
            else {
                $._state.recovery = false;
                $.emit(BunnyBus.RECOVERED_EVENT);
            }
        });
    }

    _createConnection(callback)  {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._createConnection);
        }

        Async.waterfall([
            (cb) => {

                if (!$.hasConnection) {
                    Amqp.connect($.connectionString, cb);
                }
                else {
                    cb(null, $.connection);
                }
            },
            (connection, cb) => {

                if (!$.hasConnection) {
                    $.connection = connection;
                }

                cb();
            }
        ], callback);
    }

    _closeConnection(callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._closeConnection);
        }

        Async.waterfall([
            $._closeChannel,
            (cb) => {

                if ($.hasConnection) {
                    $.connection.close(cb);
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

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._createChannel);
        }

        Async.waterfall([
            (cb) => {

                if (!$.hasConnection) {
                    cb(new Exceptions.NoConnectionError());
                }
                else if (!$.hasChannel) {
                    $.connection.createConfirmChannel(cb);
                }
                else {
                    cb(null, $.channel);
                }
            },
            (channel, cb) => {

                if (!$.hasChannel) {
                    $.channel = channel;
                }

                cb();
            },
            (cb) => {

                $.channel.prefetch($.config.prefetch, null, (err, result) => {

                    cb(err);
                });
            }
        ], callback);
    }

    _closeChannel(callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $._closeChannel);
        }

        if ($.hasChannel) {
            $.channel.close((err) => {

                if (!err) {
                    $.channel = null;
                }

                callback(err);
            });
        }
        else {
            callback();
        }
    }
}

internals.handlers[SubscriptionManager.BLOCKED_EVENT] = (queue) => {

    $.unsubscribe(queue, (err) => {

        if (err) {
            $.logger.error(err);
        }
    });
};

internals.handlers[SubscriptionManager.UNBLOCKED_EVENT] = (queue) => {

    const subscription = $._subscriptions.get(queue);

    $.subscribe(queue, subscription.handlers, subscription.options, (err) => {

        if (err) {
            $.logger.error(err);
        }
    });
};

internals.handlers[BunnyBus.AMQP_CONNECTION_ERROR_EVENT] = (err) => {

    $.emit(BunnyBus.AMQP_CONNECTION_ERROR_EVENT, err);
    $.connection = null;
    $.channel = null;
    $._recoverConnectChannel();
};

internals.handlers[BunnyBus.AMQP_CHANNEL_ERROR_EVENT] = (err) => {

    $.emit(BunnyBus.AMQP_CHANNEL_ERROR_EVENT, err);
    $.channel = null;
    $._recoverConnectChannel();
};

module.exports = BunnyBus;
