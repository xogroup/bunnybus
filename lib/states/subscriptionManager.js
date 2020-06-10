'use strict';

const EventEmitter = require('events').EventEmitter;
const Helpers = require('../helpers');

class SubscriptionManager extends EventEmitter {
    constructor() {
        super();
        this._subscriptions = new Map();
        this._blockQueues = new Set();
    }

    static get CREATED_EVENT() {
        return 'subscription.created';
    }

    static get TAGGED_EVENT() {
        return 'subscription.tagged';
    }

    static get CLEARED_EVENT() {
        return 'subscription.cleared';
    }

    static get REMOVED_EVENT() {
        return 'subscription.removed';
    }

    static get BLOCKED_EVENT() {
        return 'subscription.blocked';
    }

    static get UNBLOCKED_EVENT() {
        return 'subscription.unblocked';
    }

    contains(queue, withConsumerTag = true) {
        return withConsumerTag
            ? this._subscriptions.has(queue) && this._subscriptions.get(queue).hasOwnProperty('consumerTag')
            : this._subscriptions.has(queue);
    }

    create(queue, handlers, options) {
        if (this.contains(queue, false)) {
            return false;
        }

        this._subscriptions.set(queue, { handlers, options });
        Helpers.cleanObject(this._subscriptions.get(queue));
        this.emit(SubscriptionManager.CREATED_EVENT, this.get(queue));

        return true;
    }

    tag(queue, consumerTag) {
        if (!this.contains(queue, false)) {
            return false;
        }

        Object.assign(this._subscriptions.get(queue), { consumerTag });
        this.emit(SubscriptionManager.TAGGED_EVENT, this.get(queue));

        return true;
    }

    get(queue) {
        if (this._subscriptions.has(queue)) {
            const clone = { queue };
            Object.assign(clone, this._subscriptions.get(queue));

            return clone;
        }

        return undefined;
    }

    clear(queue) {
        if (this.contains(queue)) {
            delete this._subscriptions.get(queue).consumerTag;
            this.emit(SubscriptionManager.CLEARED_EVENT, this.get(queue));

            return true;
        }

        return false;
    }

    clearAll() {
        for (const [queue] of this._subscriptions) {
            this.clear(queue);
        }
    }

    remove(queue) {
        if (this.contains(queue, false)) {
            this.emit(SubscriptionManager.REMOVED_EVENT, this.get(queue));
            delete this._subscriptions.delete(queue);

            return true;
        }

        return false;
    }

    list() {
        const results = [];

        for (const [queue, subscription] of this._subscriptions) {
            const copy = { queue };
            Object.assign(copy, subscription);
            results.push(copy);
        }

        return results;
    }

    isBlocked(queue) {
        return this._blockQueues.has(queue);
    }

    block(queue) {
        if (this._blockQueues.has(queue)) {
            return false;
        }

        this._blockQueues.add(queue);
        this.emit(SubscriptionManager.BLOCKED_EVENT, queue);

        return true;
    }

    unblock(queue) {
        if (!this._blockQueues.has(queue)) {
            return false;
        }

        this._blockQueues.delete(queue);
        this.emit(SubscriptionManager.UNBLOCKED_EVENT, queue);

        return true;
    }
}

module.exports = SubscriptionManager;
