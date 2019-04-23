'use strict';

const RouteMatcher = require('./routeMatcher');

const handlerMatcher = (handlers, match) => {
    return Object.entries(handlers)
        .filter(([key]) => RouteMatcher(key, match))
        .map(([key, value]) => value);
};

module.exports = handlerMatcher;
