'use strict';
const Helpers = require('../helpers');

class SubscriptionManager {

    constructor() {

        this._subscriptions = {};
    }

    contains(queue, withConsumerTag = true) {

        if (withConsumerTag) {
            return this._subscriptions.hasOwnProperty(queue) && this._subscriptions[queue].hasOwnProperty('consumerTag');    
        }

        return this._subscriptions.hasOwnProperty(queue)
    }

    create(queue, consumerTag, handlers, options) {

        if (this.contains(queue)) {
            return false;
        } 
        else {
            this._subscriptions[queue] = { consumerTag, handlers, options };
            Helpers.cleanObject(this._subscriptions[queue]);

            return true;
        }
    }

    get(queue) {

        return this._subscriptions[queue];
    }

    clear(queue) {

        if (this.contains(queue)) {
            delete this._subscriptions[queue].consumerTag;
            return true;
        }

        return false;
    }

    remove(queue) {

        if (this.contains(queue, false)) {
            delete this._subscriptions[queue];
            return true;
        }

        return false;
    }
}

module.exports = SubscriptionManager;
