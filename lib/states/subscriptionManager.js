'use strict';
const EventEmitter = require('events').EventEmitter;
const Helpers = require('../helpers');

class SubscriptionManager extends EventEmitter {

    constructor() {

        super();
        this._subscriptions = {};
        this._blockQueues = new Set();
    }

    contains(queue, withConsumerTag = true) {

        if (withConsumerTag) {
            return this._subscriptions.hasOwnProperty(queue) && this._subscriptions[queue].hasOwnProperty('consumerTag');
        }

        return this._subscriptions.hasOwnProperty(queue);
    }

    create(queue, consumerTag, handlers, options) {

        if (this.contains(queue)) {
            return false;
        }

        this._subscriptions[queue] = { consumerTag, handlers, options };
        Helpers.cleanObject(this._subscriptions[queue]);
        this.emit('subscription.created', this.get(queue));

        return true;
    }

    get(queue) {

        if (this._subscriptions[queue]) {
            const clone = { queue };
            Object.assign(clone, this._subscriptions[queue]);

            return clone;
        }

        return undefined;
    }

    clear(queue) {

        if (this.contains(queue)) {
            delete this._subscriptions[queue].consumerTag;
            this.emit('subscription.cleared', this.get(queue));

            return true;
        }

        return false;
    }

    remove(queue) {

        if (this.contains(queue, false)) {
            this.emit('subscription.removed', this.get(queue));
            delete this._subscriptions[queue];

            return true;
        }

        return false;
    }

    list() {

        const results = [];

        for (const queue in this._subscriptions) {
            const copy = { queue };
            Object.assign(copy, this._subscriptions[queue]);
            results.push(copy);
        }

        return results;
    }

    block(queue) {

        if (this._blockQueues.has(queue)) {
            return false;
        }

        this._blockQueues.add(queue);
        this.emit('subscription.blocked', queue);

        return true;
    }

    unblock(queue) {

        if (!this._blockQueues.has(queue)) {
            return false;
        }

        this.emit('subscription.unblocked', queue);
        this._blockQueues.delete(queue);

        return true;
    }
}

module.exports = SubscriptionManager;
