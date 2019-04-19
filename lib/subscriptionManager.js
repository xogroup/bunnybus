'use strict';

const EventEmitter = require('events');
const Helpers = require('./helpers');

class SubscriptionManager extends EventEmitter {
    constructor() {
        super();
        this._subscriptions = new Map();
        this._blockQueues = new Set();
    }

    static get Events() {
        return {
            CREATED: 'subscription.created',
            TAGGED: 'subscription.tagged',
            CLEARED: 'subscription.cleared',
            REMOVED: 'subscription.removed',
            BLOCKED: 'subscription.blocked',
            UNBLOCKED: 'subscription.unblocked'
        };
    }

    contains(queue, withConsumerTag = true) {
        if (withConsumerTag) {
            return (
                this._subscriptions.has(queue) &&
                this._subscriptions.get(queue).hasOwnProperty('consumerTag')
            );
        }

        return this._subscriptions.has(queue);
    }

    create(queue, handlers, options) {
        if (this.contains(queue, false)) {
            return false;
        }

        this._subscriptions.set(queue, { handlers, options });
        Helpers.cleanObject(this._subscriptions.get(queue));
        this.emit(SubscriptionManager.Events.CREATED, this.get(queue));

        return true;
    }

    tag(queue, consumerTag) {
        if (!this.contains(queue, false)) {
            return false;
        }

        Object.assign(this._subscriptions.get(queue), { consumerTag });
        this.emit(SubscriptionManager.Events.TAGGED, this.get(queue));

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
            this.emit(SubscriptionManager.Events.CLEARED, this.get(queue));

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
            this.emit(SubscriptionManager.Events.REMOVED, this.get(queue));
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
        this.emit(SubscriptionManager.Events.BLOCKED, queue);

        return true;
    }

    unblock(queue) {
        if (!this._blockQueues.has(queue)) {
            return false;
        }

        this.emit(SubscriptionManager.Events.UNBLOCKED, queue);
        this._blockQueues.delete(queue);

        return true;
    }
}

module.exports = SubscriptionManager;
