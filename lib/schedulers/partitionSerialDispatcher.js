'use strict';

const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

class PartitionSerialDispatcher {
    constructor() {
        this._queues = new Map();
    }

    push(queue, delegate, payload) {}
}

module.exports = PartitionSerialDispatcher;
