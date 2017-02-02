'use strict';

const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');
const SubscriptionManager = require('./states').SubscriptionManager;

const internals = {
    instance : undefined
};

internals.promisify = (method, ...args) => {

    return new Promise((resolve, reject) => {

        args.push((err, data) => {

            if (err) {
                return reject(err);
            }

            return resolve(data);
        });

        return method(...args);
    });
};

class BunnyBus {

    constructor(config) {

        if (!internals.instance) {
            internals.instance = this;

            internals.instance._state = {
                recovery      : false,
                exchanges     : [], // { name }
                queues        : [], // { name }
                subscriptions : new SubscriptionManager()  // { queueName : [ { consumerTag, handlers, options} ] }
            };
        }

        if (config) {
            internals.instance.config = config;
        }

        return internals.instance;
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

        return internals.instance._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    }

    set config(value) {
//need to destroy state and reevaluate when this happens
        internals.instance._config = Object.assign({}, internals.instance._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION, value);
    }

    get connectionString() {

        return Helpers.createConnectionString(internals.instance._config);
    }

    get connection() {

        return internals.instance._connection;
    }

    set connection(value) {

        const $ = internals.instance;

        if (value) {
            value.on('error', $._recoverConnectChannel);
        }

        $._connection = value;
    }

    get hasConnection() {

        return internals.instance.connection ? true : false;
    }

    get channel() {

        return internals.instance._channel;
    }

    set channel(value) {

        const $ = internals.instance;

        if (value) {
            value.on('error', $._recoverConnectChannel);
        }

        $._channel = value;
    }

    get hasChannel() {

        return internals.instance.channel ? true : false;
    }

    createConnection(callback) {

        callback = Helpers.reduceCallback(callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.createConnection);
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

    closeConnection(callback) {
console.log('closing connection');
        callback = Helpers.reduceCallback(callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.closeConnection);
        }

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
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.createChannel);
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

    closeChannel(callback) {

        callback = Helpers.reduceCallback(callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.closeChannel);
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

    createExchange(name, type, options, callback) {

        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.createExchange, name, type, options);
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
console.log('deleting exchange', name);
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.deleteExchange, name, options);
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
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.checkExchange, name);
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
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.createQueue, name, options);
        }

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.assertQueue(name, Object.assign({}, BunnyBus.DEFAULT_QUEUE_CONFIGURATION, options), callback);
        }
    }

    deleteQueue(name, options, callback) {
console.log('deleting queue', name);
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.deleteQueue, name, options);
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
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.checkQueue, name);
        }

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.checkQueue(name, callback);
        }
    }

    send(message, queue, options, callback) {
console.log('sending');
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.send, message, queue, options);
        }

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
console.log('getting', queue);
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($.get, queue, options);
        }

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.get(queue, options, callback);
        }
    }

    publish(message, options, callback) {
console.log('publishing');
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;
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
        const $ = internals.instance;
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
console.log('unsubscribing', queue);
        callback = Helpers.reduceCallback(callback);
        const $ = internals.instance;
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
console.log('acking');
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.ack(payload);
            callback();
        }
    }

    _requeue(payload, queue, options, callback) {
console.log('requeuing');
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;
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
console.log('rejecting');
        callback = Helpers.reduceCallback(options, callback);
        const $ = internals.instance;
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
console.log('auto connecting');
        callback = Helpers.reduceCallback(callback);
        const $ = internals.instance;

        if (callback === undefined) {
            return internals.promisify($._autoConnectChannel);
        }

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
        const $ = internals.instance;

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
