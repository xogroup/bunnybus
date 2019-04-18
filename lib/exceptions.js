'use strict';

class NoChannelError extends Error {
    constructor(message) {
        super(message || 'no channel found');
        this.name = 'NoChannelError';
    }
}

class NoConnectionError extends Error {
    constructor(message) {
        super(message || 'no connection found');
        this.name = 'NoConnectionError';
    }
}

class NoRouteKeyError extends Error {
    constructor(message) {
        super(
            message ||
                'no route key found in either message.event or options.routeKey'
        );
        this.name = 'NoRouteKeyError';
    }
}

class SubscriptionBlockedError extends Error {
    constructor(queue, message) {
        super(message || `subscription blocked for queue of name ${queue}`);
        this.name = 'SubscriptionBlockedError';
    }
}

class SubscriptionExistError extends Error {
    constructor(queue, message) {
        super(
            message || `subscription already exist for queue of name ${queue}`
        );
        this.name = 'SubscriptionExistError';
    }
}

module.exports = {
    NoConnectionError,
    NoChannelError,
    NoRouteKeyError,
    SubscriptionExistError,
    SubscriptionBlockedError
};
