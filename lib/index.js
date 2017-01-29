'use strict';

const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Helpers = require('./helpers');
const Exceptions = require('./exceptions');

const internals = {
    instance : undefined
};

class BunnyBus {

    constructor(config) {

        if (!internals.instance) {
            internals.instance = this;

            internals.instance._state = {
                recovery      : false,
                exchanges     : [], // { name }
                queues        : [], // { name }
                subscriptions : {}  // { queueName : [ { consumerTag, handlers, options} ] }
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

        const $ = internals.instance;

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
        const $ = internals.instance;

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

        const $ = internals.instance;

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

        const $ = internals.instance;

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

        const $ = internals.instance;

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
        const $ = internals.instance;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.deleteExchange(name, options, callback);
        }
    }

    checkExchange(name, callback) {

        const $ = internals.instance;

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

        const $ = internals.instance;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.assertQueue(name, Object.assign({}, BunnyBus.DEFAULT_QUEUE_CONFIGURATION, options), callback);
        }
    }

    deleteQueue(name, options, callback) {
console.log('deleting queue', name);
        const $ = internals.instance;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.deleteQueue(name, options, callback);
        }
    }

    checkQueue(name, callback) {

        const $ = internals.instance;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.checkQueue(name, callback);
        }
    }

    send(message, queue, options, callback) {
console.log('sending');
        const $ = internals.instance;
        //rename callingModule to source
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

        const $ = internals.instance;

        if (!$.hasChannel) {
            callback(new Exceptions.NoChannelError());
        }
        else {
            $.channel.get(queue, options, callback);
        }
    }

    publish(message, options, callback) {
console.log('publishing');
        const $ = internals.instance;
        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const routeKey = (options && options.routeKey) || (message && message.event);
        //rename callingModule to source
        const callingModule = (options && options.callingModule);

        if (!routeKey) {
            callback(new Exceptions.NoRouteKeyError());
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

        const $ = internals.instance;

        if ($._state.subscriptions[queue]) {
            callback(new Exceptions.SubscriptionExistError(null, queue));
            return;
        }

        $._state.subscriptions[queue] = {};
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
console.log(payload.properties.headers.routeKey, message.event, payload.fields.routingKey);
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

                        $._state.subscriptions[queue] = { consumerTag : result.consumerTag, handlers, options };

                        cb(err);
                    });
            }]
        }, (err, results) => callback(err));
    }

    unsubscribe(queue, callback) {

        const $ = insternals.instance;

        if (_hasSubscription(queue)) {
            $.channel.cancel($_state.subscriptions[queue].consumerTag, (err, result) => {

                delete $._state.subscriptions[queue].consumerTag;
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
        const $ = internals.instance;

        if ($.hasConnection || $.hasChannel) {
            callback();
        }
        else {
            Async.waterfall([
                $.createConnection,
                $.createChannel
            ], callback);
        }
    }

    _recoverConnectChannel(callback) {
console.log('recovering channel');
        const $ = internals.instance;

        $._state.recovery = true;

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
                $._state.recovery = false;
            }
        });
    }

    _hasSubscription(queue, withConsumerTag = true) {

        const $ = internals.instance;

        if (withConsumerTag) {
            return $._state.subscriptions.hasOwnProperty(queue) && $._state.subscriptions[queue].hasOwnProperty('consumerTag');    
        }

        return $._state.subscriptions.hasOwnProperty(queue)
    }

    _createSubscription(queue, consumerTag, handlers, options) {

        const $ = internals.instance;

        if ($._hasSubscription(queue)) {
            return false;
        } 
        else {
            $._state.subscriptions[queue] = { consumerTag : consumerTag, handlers, options };
            return true;
        }
    }

    _clearSubscription(queue) {

        const $ = internals.instance;

        if ($._hasSubscription(queue)) {
            delete $._state.subscriptions[queue].consumerTag;
            return true;
        }

        return false;
    }

    _removeSubscription(queue) {

        const $ = internals.instance;

        if($._hasSubscription(queue, false)) {
            delete $._state.subscriptions[queue];
            return true;
        }

        return false;
    }
}

module.exports = BunnyBus;
