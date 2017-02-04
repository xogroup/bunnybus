'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const SubscriptionManager = require('./states').SubscriptionManager;
const EventLogger = require('./loggers').EventLogger;

let $ = undefined;

class BunnyBus extends EventEmitter{

    constructor(config) {

        if (!$) {
            super();

            $ = this;

            $._state = {
                recovery      : false,
                exchanges     : [], // { name }
                queues        : [], // { name }
                subscriptions : new SubscriptionManager()  // { queueName : [ { consumerTag, handlers, options} ] }
            };

            $.logger = new EventLogger($);

            // Default to native promises
            $.promise = Promise;
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

    get config() {

        return $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {
//need to destroy state and reevaluate when this happens
        $._config = Object.assign({}, $._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION, value);
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
            value.on('error', $._recoverConnectChannel);
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
            value.on('error', $._recoverConnectChannel);
        }

        $._channel = value;
    }

    get hasChannel() {

        return $.channel ? true : false;
    }

    createConnection(callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.createConnection);
        }
console.log('creating connection');
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

    closeConnection(callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.closeConnection);
        }
console.log('closing connection');
        Async.waterfall([
            $.closeChannel,
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

    createChannel(callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.createChannel);
        }
console.log('creating channel');
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

    closeChannel(callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.closeChannel);
        }
console.log('closing channel');
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

    createExchange(name, type, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.createExchange, name, type, options);
        }
console.log('creating exchange');
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
console.log('deleting exchange', name);
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
            //TODO, callback needs to be proxied so we can down the channel when this comes back negative.
            //Also test needs to be added for this.
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
console.log('creating queue');
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
console.log('deleting queue', name);
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
console.log('sending');
        //TODO rename callingModule to source
        const callingModule = (options && options.callingModule);

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
                        callingModule,
                        createdAt     : (new Date()).toISOString()
                    }
                };

                $.channel.sendToQueue(queue, results.convert_message, sendOptions, cb);
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
console.log('getting', queue);
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
console.log('publishing');
        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const routeKey = (options && options.routeKey) || (message && message.event);
        //rename callingModule to source
        const callingModule = (options && options.callingModule);

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
                        callingModule,
                        routeKey,
                        createdAt     : (new Date()).toISOString()
                    }
                };

                $.channel.publish(globalExchange, routeKey, results.convert_message, publishOptions, cb);
            }],
            wait                  : ['publish', (results, cb) => {

                $.channel.waitForConfirms(cb);
            }]
        }, (err, results) => callback(err));
    }

    ///
    /// options : not amqp
    ///
    subscribe(queue, handlers, options, callback) {

        callback = Helpers.reduceCallback(options, callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.subscribe, queue, handlers, options);
        }

        const $S = $._state.subscriptions;

        if ($S.contains(queue)) {
            callback(new Exceptions.SubscriptionExistError(null, queue));
            return;
        }

        $S.create(queue);
console.log('subscribing');

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

                $.channel.consume(
                    queue,
                    (payload) => {
console.log('generic handler');
                        const message = JSON.parse(payload.content.toString());
                        const routeKey = payload.properties.headers.routeKey || message.event || payload.fields.routingKey;
                        const currentRetryCount = payload.properties.headers.retryCount || -1;
                        const errorQueue = `${queue}_error`;
                        //should put this in the publish func()
                        // var routeKey = isValidRoute(payload.fields.routingKey) || isValidRoute(message.event);

                        if (handlers.hasOwnProperty(routeKey)) {
                            if (currentRetryCount < maxRetryCount) {
console.log('generic handler passing to custom handler');
                                handlers[routeKey](
                                    message,
                                    $._ack.bind(null, payload),
                                    $._reject.bind(null, payload, errorQueue),
                                    $._requeue.bind(null, payload, queue, { routeKey })
                                );
                            }
                            else {
console.log('generic handler reject');
                                $._reject(payload, errorQueue);
                            }
                        }
                        else {
console.log('generic handler ack');
                            $.channel.ack(payload);
                        }
                        //TODO
                        //* collect consume tag info so we can pause/cancel subscription
                        // save the handlers + options in a state to resume cancelled subscriptions
                        //* validate message format
                    },
                    null,
                    (err, result) => {
console.log('generic handler just updated subscription');
                        $S.create(queue, result.consumerTag, handlers, options);

                        cb(err);
                    });
            }]
        }, (err, results) => callback(err));
    }

    unsubscribe(queue, callback) {

        callback = Helpers.reduceCallback(callback);

        if (callback === undefined) {
            return Helpers.toPromise($.promise, $.unsubscribe, queue);
        }
console.log('unsubscribing', queue);
        const $S = $._state.subscriptions;

        if ($S.contains(queue)) {
            $.channel.cancel($S.get(queue).consumerTag, (err, result) => {

                $S.clear(queue);
                callback(err);
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
console.log('acking');
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
console.log('requeuing');
        const routeKey = options && options.routeKey ? options.routeKey : null;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            const sendOptions = {
                headers : {
                    transactionId : payload.properties.headers.transactionId,
                    callingModule : payload.properties.headers.callingModule,
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
console.log('rejecting');
        const queue = errorQueue || $.config.server.errorQueue;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            //implement error reasion
            const sendOptions = {
                headers : {
                    transactionId : payload.properties.headers.transactionId,
                    callingModule : payload.properties.headers.callingModule,
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
console.log('auto connecting');
        if ($.hasConnection || $.hasChannel) {
console.log('auto connect detected existing connection + channel');
            callback();
        }
        else {
            Async.waterfall([
                $.createConnection,
                $.createChannel
            ], callback);
        }
    }

    _recoverConnectChannel(err) {
console.log('recovering channel');
console.log('err', err);

        $._state.recovery = true;

        //TODO need to check to see if retry executes immediately.
        //Retry 240 times every 15 seconds if there is a connection problem.
        //If after 1 hour the issue does not resolve, kill the process.
        Async.retry({
            times   : 240,
            interval: 15000
        }, (cb) => {

            Async.waterfall([
                $.closeConnection,
                $._autoConnectChannel
            ], cb);
        },
        (err) => {

            if (err) {
                process.exit(1);
            }
            else {
console.log('recovering channel successful');
                $._state.recovery = false;
            }
        });
    }
}

module.exports = BunnyBus;
