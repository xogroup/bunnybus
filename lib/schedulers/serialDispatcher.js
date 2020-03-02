'use strict';

const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

class SerialDispatcher {

    constructor() {

        this._queues = new Map();
    }

    _setupQueue(queue) {

        const self = this;
        const context = {
            queue,
            buffer: [],
            intervalRef: setIntervalAsync(async () => {

                const ctx = self._queues.get(queue);
                const delegate = context.buffer.shift();

                if (delegate)  {
                    await delegate();

                    if (!ctx.buffer.length) {
                        this._queues.delete(queue);
                        clearIntervalAsync(ctx.intervalRef);
                    }
                }
            }, 10)
        };

        self._queues.set(queue, context);

        return context;
    }

    push(queue, delegate) {

        // do not deconstruct this because it is a hot path
        (!this._queues.has(queue) ? this._setupQueue(queue) : this._queues.get(queue)).buffer.push(delegate);
    }
}

module.exports = SerialDispatcher;
