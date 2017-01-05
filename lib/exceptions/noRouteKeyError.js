'use strict';

class NoRouteKeyError extends Error {

    constructor(message) {

        super(message || 'no route key found in either message.event or options.routeKey');
        this.name = 'NoRouteKeyError';
    }
}

module.exports = NoRouteKeyError;
