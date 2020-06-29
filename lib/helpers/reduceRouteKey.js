'use strict';

const Hoek = require('@hapi/hoek');

const reduceRouteKey = (payload, options, message) => {
    return (
        Hoek.reach(payload, 'properties.headers.routeKey') ||
        Hoek.reach(options, 'routeKey') ||
        Hoek.reach(message, 'event') ||
        Hoek.reach(payload, 'fields.routingKey') ||
        undefined
    );
};

module.exports = reduceRouteKey;
