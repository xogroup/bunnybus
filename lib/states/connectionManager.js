'use strict';

const EventEmitter = require('events').EventEmitter;
const Amqp = require('amqplib');
const Helpers = require('../helpers');


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
            : {
                name,
                lock: false,
                connection: undefined,
                connectionOptions,
                socketOptions
            };

        if (connectionContext.connection) {
            return connectionContext.connection;
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

        return connectionContext.connection;
    }

    contains(name) {

        return this._connections.has(name);
    }

    get(name) {

        return this._connections.has(name)
            ? Object.assign({}, this._connections.get(name))
            : undefined;
    }

    getConnection(name) {

        return this._connections.has(name)
            ? this._connections.get(name).connection
            : undefined;
    }

    async closeConnection(name) {

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
