'use strict';

const Amqp = require('amqplib/callback_api');
const Async = require('async');
const Helpers = require('./helpers');

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

    static get DEFAULT_CONFIGURATION() {

        return Helpers.defaultConfiguration;
    }

    get config() {

        return this._config || BunnyBus.DEFAULT_CONFIGURATION;
    }

    set config(value) {

        this._config = Object.assign({}, this._config || BunnyBus.DEFAULT_CONFIGURATION, value);
    }

    get connectionString() {

        return Helpers.createConnectionString(this._config);
    }


    get connection() {

        return this._connection;
    }

    set connection(value) {

        this._connection = value;
    }

    get hasConnection() {

        return this.connection ? true : false;
    }

    get channel() {

        return this._channel;
    }

    set channel(value) {

        this._channel = value;
    }

    get hasChannel() {

        return this.channel ? true : false;
    }

    createConnection(callback) {

        const self = this;

        Async.waterfall([
            (cb) => {

                if (!self.hasConnection) {
                    Amqp.connect(self.connectionString, cb);
                }
                else {
                    cb(null, self.connection);
                }
            },
            (connection, cb) => {

                if (!self.hasConnection) {
                    self.connection = connection;
                }

                cb();
            }
        ], callback);
    }

    closeConnection(callback) {

        const self = this;

        Async.waterfall([
            self.closeChannel.bind(self),
            (cb) => {

                if (self.hasConnection) {
                    self.connection.close(cb);
                }
                else {
                    cb();
                }
            }
        ], (err) => {

            if (!err) {

                self.connection = null;
            }

            callback(err);
        });
    }

    createChannel(callback) {

        const self = this;

        Async.waterfall([
            (cb) => {

                if (!self.hasConnection) {
                    cb(new Error('no connection found'));
                }

                if (!self.hasChannel) {
                    self.connection.createConfirmChannel(cb);
                }
                else {
                    cb(null, self.channel);
                }
            },
            (channel, cb) => {

                if (!self.hasChannel) {
                    self.channel = channel;
                }

                cb();
            }
        ], callback);
    }

    closeChannel(callback) {

        const self = this;

        if (self.hasChannel) {

            self.channel.close((err) => {

                if (!err) {
                    self.channel = null;
                }

                callback(err);
            });
        }
        else {
            callback();
        }
    }
}

module.exports = BunnyBus;
