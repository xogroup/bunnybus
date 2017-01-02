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

        internals.instance._config = Object.assign({}, internals.instance._config || BunnyBus.DEFAULT_SERVER_CONFIGURATION, value);
    }

    get connectionString() {

        return Helpers.createConnectionString(internals.instance._config);
    }

    get connection() {

        return internals.instance._connection;
    }

    set connection(value) {

        internals.instance._connection = value;
    }

    get hasConnection() {

        return internals.instance.connection ? true : false;
    }

    get channel() {

        return internals.instance._channel;
    }

    set channel(value) {

        internals.instance._channel = value;
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
            $.channel.assertExchange(name, type || 'topic', Object.assign({}, BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION, options), callback);
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
}

module.exports = BunnyBus;
