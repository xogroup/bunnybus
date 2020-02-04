'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib');
const Helpers = require('../helpers');
const Events = require('../events');

class Connection extends EventEmitter {

    constructor(name, connectionOptions, socketOptions) {

        super();

        this._name = name;
        this._connectionOptions = connectionOptions;
        this._socketOptions = socketOptions;
        this._lock = false;
        this._connection = undefined;

        return this;
    }

    get name() {

        return this._name;
    }

    get connectionOptions() {

        return this._connectionOptions;
    }

    get socketOptions() {

        return this._socketOptions;
    }

    get lock() {

        return this._lock;
    }

    set lock(value) {

        this._lock = value;
    }

    get connection() {

        return this._connection;
    }

    set connection(value) {

        this._connection = value;
    }
}

class ConnectionManager extends EventEmitter {

    constructor() {

        super();

        this._connections = new Map();

        return this;
    }

    async create(name, connectionOptions, socketOptions = undefined) {

        if (!connectionOptions) {
            throw new Error('Expected connectionOptions to be supplied');
        }

        const isNew = !this._connections.has(name);

        const connectionContext = !isNew
            ? this._connections.get(name)
            : new Connection(name, connectionOptions, socketOptions);

        if (connectionContext.connection) {
            return connectionContext;
        }

        if (isNew) {
            this._connections.set(name, connectionContext);
        }

        if (connectionContext.lock) {
            await new Promise((resolve) => {

                const intervalRef = setInterval(() => {

                    if (!connectionContext.lock && connectionContext.connection) {
                        clearInterval(intervalRef);
                        resolve();
                    }
                }, 200);
            });
        }
        else {
            await Helpers.retryAsync(
                async () => {

                    connectionContext.lock = true;
                    connectionContext.connection = await Helpers.timeoutAsync(Amqp.connect, connectionOptions.timeout)(connectionOptions, socketOptions);
                    connectionContext.connection
                        .on('close', () => connectionContext.emit(Events.AMQP_CONNECTION_CLOSE_EVENT))
                        .on('error', (err) => connectionContext.emit(Events.AMQP_CONNECTION_ERROR_EVENT, err))
                        .on('blocked', (reason) => connectionContext.emit(Events.AMQP_CONNECTION_BLOCKED_EVENT, reason))
                        .on('unblocked', () => connectionContext.emit(Events.AMQP_CONNECTION_UNBLOCKED_EVENT));
                },
                Helpers.exponentialBackoff,
                connectionOptions.connectionRetryCount,
                (err) => {

                    return err.code && err.code === 'ENOTFOUND'
                        ? false
                        : true;
                }
            );

            connectionContext.lock = false;
        }

        return connectionContext;
    }

    contains(name) {

        return this._connections.has(name);
    }

    get(name) {

        return this._connections.get(name);
    }

    getConnection(name) {

        return this._connections.has(name)
            ? this._connections.get(name).connection
            : undefined;
    }

    async close(name) {

        if (this._connections.has(name)) {

            const connectionContext = this._connections.get(name);

            if (connectionContext.connection) {
                const oldConnection = connectionContext.connection;
                connectionContext.connection = undefined;
                await oldConnection.close();
            }
        }
    }

    // create a connection
    // close a connection
    // auto recover
    // retrieve a connection
    // does connection exist

}

module.exports = ConnectionManager;
