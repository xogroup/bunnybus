'use strict';

class SubscriptionBlockedError extends Error {
    constructor(queue) {
        super(`subscription blocked for queue of name ${queue}`);
        this.name = 'SubscriptionBlockedError';
    }
}

module.exports = SubscriptionBlockedError;
