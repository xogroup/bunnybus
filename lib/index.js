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

        return this._config;
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

    get channel() {

        return this._channel;
    }

    connect(callback) {

        const self = this;

        Async.waterfall([
            (cb) => {

                Amqp.connect(self.connectionString, cb);
            },
            (connection, cb) => {

                self._connection = connection;
                cb();
            },
            (cb) => {

                self._connection.createConfirmChannel(cb);
            },
            (channel, cb) => {

                self._channel = channel;
                cb();
            }
        ], callback);
    }
}

module.exports = BunnyBus;
