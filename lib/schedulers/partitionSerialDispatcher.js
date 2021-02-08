'use strict';

const Hoek = require('@hapi/hoek');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

class PartitionSerialDispatcher {
    constructor({ serialDispatchPartitionKeySelectors = [] } = {}) {
        this._queues = new Map();
        this.serialDispatchPartitionKeySelectors = serialDispatchPartitionKeySelectors;
    }

    _setupQueue(queue) {
        const context = {
            queue,
            buffer: [],
            intervalRef: setIntervalAsync(async () => {
                const ctx = this._queues.get(queue);

                const delegate = ctx.buffer.shift();

                if (delegate) {
                    await delegate();

                    if (!ctx.buffer.length) {
                        this._queues.delete(queue);
                        clearIntervalAsync(ctx.intervalRef);
                    }
                }
            }, 10)
        };

        this._queues.set(queue, context);

        return context;
    }

    push(queue, delegate, payload) {
        const partitionKeySelector = this.serialDispatchPartitionKeySelectors.find((x) => typeof x === 'string' && x.length > 0);

        const partitionKey =
            payload && partitionKeySelector ? `${queue}:${Hoek.reachTemplate(payload, partitionKeySelector)}` : `${queue}:default`;

        (!this._queues.has(partitionKey) ? this._setupQueue(partitionKey) : this._queues.get(partitionKey)).buffer.push(delegate);
    }
}

module.exports = PartitionSerialDispatcher;
