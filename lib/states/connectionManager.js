'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib');
const Helpers = require('../helpers');

class Connection extends EventEmitter {

    constructor(name, connectionOptions, socketOptions) {

        super();

        this._name = name;
        this._connectionOptions = connectionOptions;
        this._socketOptions = socketOptions;
        this._lock = false;
        this._blocked = false;
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

    get blocked() {

        return this._blocked;
    }

    set blocked(value) {

        this._blocked = value;
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

    static get AMQP_CONNECTION_ERROR_EVENT() {

        return 'amqp.connection.error';
    }

    static get AMQP_CONNECTION_CLOSE_EVENT() {

        return 'amqp.connection.close';
    }

    static get AMQP_CONNECTION_BLOCKED_EVENT() {

        return 'amqp.connection.blocked';
    }

    static get AMQP_CONNECTION_UNBLOCKED_EVENT() {

        return 'amqp.connection.unblocked';
    }

    static get CONNECTION_REMOVED() {

        return 'connectionManager.removed';
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
            connectionContext.lock = true;

            try {
                await Helpers.retryAsync(
                    async () => {

                        connectionContext.connection = await Helpers.timeoutAsync(Amqp.connect, connectionOptions.timeout)(connectionOptions, socketOptions);
                        connectionContext.connection
                            .on('close', () => {

                                connectionContext.connection = undefined;
                                connectionContext.emit(ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT, connectionContext);
                            })
                            .on('error', (err) => {

                                connectionContext.emit(ConnectionManager.AMQP_CONNECTION_ERROR_EVENT, err, connectionContext);
                            })
                            .on('blocked', (reason) => {

                                connectionContext.blocked = true;
                                connectionContext.emit(ConnectionManager.AMQP_CONNECTION_BLOCKED_EVENT, connectionContext, reason);
                            })
                            .on('unblocked', () => {

                                connectionContext.blocked = false;
                                connectionContext.emit(ConnectionManager.AMQP_CONNECTION_UNBLOCKED_EVENT, connectionContext);
                            });
                    },
                    Helpers.exponentialBackoff,
                    connectionOptions.connectionRetryCount,
                    (err) => {

                        return err.code && err.code === 'ENOTFOUND'
                            ? false
                            : true;
                    }
                );
            }
            catch (err) {
                this._connections.delete(name);
                throw err;
            }

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

    hasConnection(name) {

        return this.getConnection(name)
            ? true
            : false;
    }

    getConnection(name) {

        return this._connections.has(name)
            ? this._connections.get(name).connection
            : undefined;
    }

    async remove(name) {

        if (this._connections.has(name)) {

            const connectionContext = this._connections.get(name);

            await this.close(name);

            this._connections.delete(name);

            connectionContext.emit(ConnectionManager.CONNECTION_REMOVED, connectionContext);
            this.emit(ConnectionManager.CONNECTION_REMOVED, connectionContext);
        }
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
}

module.exports = ConnectionManager;
