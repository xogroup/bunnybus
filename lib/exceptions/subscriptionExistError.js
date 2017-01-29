'use strict';

class SubscriptionExistError extends Error {

    constructor(queue, message) {

        super(message || `subscription already exist for queue of name ${queue}`);
        this.name = 'SubscriptionExistError';
    }
}

module.exports = SubscriptionExistError;
