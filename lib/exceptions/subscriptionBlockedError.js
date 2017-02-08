'use strict';

class SubscriptionBlockedError extends Error {

    constructor(queue, message) {

        super(message || `subscription blocked for queue of name ${queue}`);
        this.name = 'SubscriptionBlockedError';
    }
}

module.exports = SubscriptionBlockedError;
