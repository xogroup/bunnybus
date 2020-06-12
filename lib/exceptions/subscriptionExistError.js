'use strict';

class SubscriptionExistError extends Error {
    constructor(queue) {
        super(`subscription already exist for queue of name ${queue}`);
        this.name = 'SubscriptionExistError';
    }
}

module.exports = SubscriptionExistError;
