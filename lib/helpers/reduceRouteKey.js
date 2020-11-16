'use strict';

const reduceRouteKey = (payload, options, message) => {

    if (payload && payload.properties && payload.properties.headers && payload.properties.headers.routeKey) {
        return payload.properties.headers.routeKey;
    }

    if (options && options.routeKey) {
        return options.routeKey;
    }

    if (message && message.event) {
        return message.event;
    }

    if (payload && payload.fields && payload.fields.routingKey) {
        return payload.fields.routingKey;
    }

    return undefined;
};

module.exports = reduceRouteKey;
