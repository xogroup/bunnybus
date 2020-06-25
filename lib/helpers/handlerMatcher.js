'use strict';

const RouteMatcher = require('./routeMatcher');

const handlerMatcher = (handlers, match) => {
    const result = [];

    for (const key in handlers) {
        if (RouteMatcher(key, match)) {
            result.push(handlers[key]);
            break;
        }
    }

    return result;
};

module.exports = handlerMatcher;
