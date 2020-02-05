'use strict';

const EventEmitter = require('events').EventEmitter;
const Helpers = require('../helpers');
const Events = require('../events');
const Exceptions = require('../exceptions');

class Channel extends EventEmitter {

    constructor(name, connectionContext, channelOptions) {

        super();

        this._name = name;
        this._connectionContext = connectionContext;
        this._channelOptions = channelOptions;
        this._lock = false;
        this._channel = undefined;
    }

    get name() {

        return this._name;
    }

    get connectionContext() {

        return this._connectionContext;
    }

    get channelOptions() {

        return this._channelOptions;
    }

    get lock() {

        return this._lock;
    }

    set lock(value) {

        this._lock = value;
    }

    get channel() {

        return this._channel;
    }

    set channel(value) {

        this._channel = value;
    }
}

class ChannelManager extends EventEmitter {

    constructor() {

        super();

        this._channels = new Map();

        return this;
    }

    async create(name, connectionContext, channelOptions) {

        const self = this;

        if (!connectionContext || !connectionContext.connection) {
            throw new Exceptions.NoConnectionError();
        }

        if (!channelOptions) {
            throw new Error('Expected channelOptions to be supplied');
        }

        const isNew = !this._channels.has(name);

        const channelContext = !isNew
            ? this._channels.get(name)
            : new Channel(name, connectionContext, channelOptions);

        if (channelContext.channel) {
            return channelContext;
        }

        if (isNew) {
            this._channels.set(name, channelContext);
        }

        if (channelContext.lock) {
            await new Promise((resolve) => {

                const intervalRef = setInterval(() => {

                    if (!channelContext.lock && channelContext.channel) {
                        clearInterval(intervalRef);
                        resolve();
                    }
                }, 200);
            });
        }
        else {
            await Helpers.retryAsync(
                async () => {

                    channelContext.lock = true;
                    channelContext.channel = await Helpers.timeoutAsync(connectionContext.connection.createConfirmChannel.bind(connectionContext.connection), channelOptions.timeout)();
                    channelContext.channel
                        .on('close', () => {

                            channelContext.channel = undefined;
                            channelContext.emit(Events.AMQP_CHANNEL_CLOSE_EVENT, channelContext);
                        })
                        .on('error', (err) => {

                            channelContext.emit(Events.AMQP_CHANNEL_ERROR_EVENT, err, channelContext);
                        })
                        .on('return', (payload) => {

                            channelContext.emit(Events.AMQP_CHANNEL_RETURN_EVENT, channelContext, payload);
                        })
                        .on('drain', () => {

                            channelContext.emit(Events.AMQP_CHANNEL_DRAIN_EVENT, channelContext);
                        });

                    connectionContext.on(Events.CONNECTION_MANAGER_REMOVED, async () => self.remove(name));
                },
                Helpers.exponentialBackoff,
                channelOptions.connectionRetryCount
            );

            await channelContext.channel.prefetch(channelOptions.prefetch);

            channelContext.lock = false;
        }

        return channelContext;
    }

    contains(name) {

        return this._channels.has(name);
    }

    get(name) {

        return this._channels.get(name);
    }

    hasChannel(name) {

        return this.getChannel(name)
            ? true
            : false;
    }

    getChannel(name) {

        return this._channels.has(name)
            ? this._channels.get(name).channel
            : undefined;
    }

    async remove(name) {

        if (this._channels.has(name)) {

            const channelContext = this._channels.get(name);

            await this.close(name);

            this._channels.delete(name);

            channelContext.emit(Events.CHANNEL_MANAGER_REMOVED, channelContext);
            this.emit(Events.CHANNEL_MANAGER_REMOVED, channelContext);
        }
    }

    async close(name) {

        if (this._channels.has(name)) {

            const channelContext = this._channels.get(name);

            if (channelContext.channel) {
                const oldChannel = channelContext.channel;
                channelContext.channel = undefined;
                await oldChannel.close();
            }
        }
    }
}

module.exports = ChannelManager;
