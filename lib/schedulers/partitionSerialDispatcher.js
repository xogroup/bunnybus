'use strict';

const Hoek = require('@hapi/hoek');
const Denque = require('denque');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

class PartitionSerialDispatcher {
    constructor(config) {
        this._queues = new Map();
        this.config(config);
    }

    config({ serialDispatchPartitionKeySelectors = [] } = {}) {
        this.serialDispatchPartitionKeySelectors = serialDispatchPartitionKeySelectors.filter((x) => typeof x === 'string' && x.length > 0);
    }

    _setupQueue(queue) {
        const context = {
            queue,
            buffer: new Denque(),
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
        let partitionKeySelector = '';

        if (this.serialDispatchPartitionKeySelectors.length && payload) {
            partitionKeySelector = this.serialDispatchPartitionKeySelectors
                .map((x) => Hoek.reachTemplate(payload, x))
                .find((x) => x && x.length);
        }

        const partitionKey = partitionKeySelector ? `${queue}:${partitionKeySelector}` : `${queue}:default`;

        (!this._queues.has(partitionKey) ? this._setupQueue(partitionKey) : this._queues.get(partitionKey)).buffer.push(delegate);
    }
}

module.exports = PartitionSerialDispatcher;
