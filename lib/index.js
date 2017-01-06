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
                recovery : false,
                exchanges: [], // { name }
                queues   : [] // { name }
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

        const $ = internals.instance;
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

        $.channel.get(queue, options, callback);
    }

    publish(message, options, callback) {

        const $ = internals.instance;
        const globalExchange = (options && options.globalExchange) || $.config.globalExchange;
        const routeKey = (options && options.routeKey) || (message && message.event);
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

        Async.auto({
            intialize      : $._autoConnectChannel,
            //cache the queue
            create_queue   : ['initialize', $.createQueue.bind($, queue, options.queue)],
            //cache the exchange
            create_exchange: ['initialize', $.createExchange.bind($, $.config.globalExchange, 'topic', null)],
            bind_routes    : ['create_queue', 'create_exchange', (cb) => {

                Async.mapValues(
                    handlers,
                    (handler, pattern, mapCB) => {

                        $.channel.bindQueue(queue, $.config.globalExchange, pattern, null, mapCB);
                    },
                    cb
                );
            }],
            setup_consumer : ['create_queue', (cb) => {

                $.channel.consume(
                    queue,
                    (message) => {

                        //TODO
                        //* collect consume tag info so we can pause/cancel subscription
                        //* validate routing
                        //* validate headers for retries
                        //* validate message format
                    },
                    cb);
            }]
        }, callback);
    }

    _autoConnectChannel(callback) {

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
}

module.exports = BunnyBus;
