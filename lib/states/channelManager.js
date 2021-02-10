'use strict';

const EventEmitter = require('events').EventEmitter;
const Helpers = require('../helpers');
const ConnectionManager = require('./connectionManager');
const Exceptions = require('../exceptions');

class Channel extends EventEmitter {
    constructor(name, queue = null, connectionContext, channelOptions) {
        super();

        this._createdAt = Date.now();
        this._name = name;
        this._queue = queue;
        this._connectionContext = connectionContext;
        this._channelOptions = channelOptions;
        this._lock = false;
        this._channel = undefined;
    }

    get name() {
        return this._name;
    }

    get uniqueName() {
        return `channel_${this._name}_${this._createdAt}`;
    }

    get queue() {
        return this._queue;
    }

    get connectionContext() {
        return this._connectionContext;
    }

    set connectionContext(value) {
        this._connectionContext = value;
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

    get healthy() {
        const lockTimeDiff = Date.now() - (this.lock || Date.now());
        const overTimeLimit = lockTimeDiff > this.channelOptions.timeout * this.channelOptions.connectionRetryCount;

        return overTimeLimit ? Boolean(this.channel) : true;
    }
}

class ChannelManager extends EventEmitter {
    constructor() {
        super();

        this._channels = new Map();

        return this;
    }

    static get AMQP_CHANNEL_ERROR_EVENT() {
        return 'amqp.channel.error';
    }

    static get AMQP_CHANNEL_CLOSE_EVENT() {
        return 'amqp.channel.close';
    }

    static get AMQP_CHANNEL_RETURN_EVENT() {
        return 'amqp.channel.return';
    }

    static get AMQP_CHANNEL_DRAIN_EVENT() {
        return 'amqp.channel.drain';
    }

    static get CHANNEL_REMOVED() {
        return 'channelManager.removed';
    }

    get healthy() {
        for (const context of this.list()) {
            if (!context.healthy) {
                return false;
            }
        }

        return true;
    }

    async create(name, queue = null, connectionContext, channelOptions) {
        if (!connectionContext || !connectionContext.connection) {
            throw new Exceptions.NoConnectionError();
        }

        if (!channelOptions) {
            throw new Error('Expected channelOptions to be supplied');
        }

        const isNew = !this._channels.has(name);

        const channelContext = !isNew ? this._channels.get(name) : new Channel(name, queue, connectionContext, channelOptions);

        channelContext.connectionContext = connectionContext;

        if (channelContext.channel) {
            return channelContext;
        }

        if (isNew) {
            this._channels.set(name, channelContext);
        }

        if (channelContext.lock) {
            await Helpers.intervalAsync(async () => !channelContext.lock && channelContext.channel);
        } else {
            channelContext.lock = Date.now();

            try {
                await Helpers.retryAsync(
                    async () => {
                        channelContext.channel = await Helpers.timeoutAsync(
                            connectionContext.connection.createConfirmChannel.bind(connectionContext.connection),
                            channelContext.channelOptions.timeout
                        )();
                        channelContext.channel
                            .on('close', () => {
                                channelContext.channel = undefined;
                                channelContext.emit(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, channelContext);
                            })
                            .on('error', (err) => {
                                channelContext.emit(ChannelManager.AMQP_CHANNEL_ERROR_EVENT, err, channelContext);
                            })
                            .on('return', (payload) => {
                                channelContext.emit(ChannelManager.AMQP_CHANNEL_RETURN_EVENT, channelContext, payload);
                            })
                            .on('drain', () => {
                                channelContext.emit(ChannelManager.AMQP_CHANNEL_DRAIN_EVENT, channelContext);
                            });

                        connectionContext
                            .removeAllListeners(ConnectionManager.CONNECTION_REMOVED)
                            .on(ConnectionManager.CONNECTION_REMOVED, async () => this.remove(name));
                    },
                    Helpers.exponentialBackoff,
                    channelOptions.connectionRetryCount
                );

                await channelContext.channel.prefetch(channelOptions.prefetch);
            } catch (err) {
                this._channels.delete(name);
                throw err;
            } finally {
                channelContext.lock = undefined;
            }
        }

        return channelContext;
    }

    contains(name) {
        return this._channels.has(name);
    }

    get(name) {
        return this._channels.get(name);
    }

    list() {
        const results = [];

        for (const [name, context] of this._channels) {
            results.push(context);
        }

        return results;
    }

    hasChannel(name) {
        return this.getChannel(name) ? true : false;
    }

    getChannel(name) {
        return this._channels.has(name) ? this._channels.get(name).channel : undefined;
    }

    async remove(name) {
        if (this._channels.has(name)) {
            const channelContext = this._channels.get(name);

            await this.close(name);

            this._channels.delete(name);

            channelContext.emit(ChannelManager.CHANNEL_REMOVED, channelContext);
            this.emit(ChannelManager.CHANNEL_REMOVED, channelContext);
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
