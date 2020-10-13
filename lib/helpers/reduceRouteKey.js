'use strict';

const reduceRouteKey = (payload, options, message) => {

    if (payload && payload.properties && payload.properties.headers && payload.properties.headers.routeKey) {
        return payload.properties.headers.routeKey;
    }

    if (payload && payload.fields && payload.fields.routingKey) {
        return payload.fields.routingKey;
    }

    if (options && options.routeKey) {
        return options.routeKey;
    }

    if (message && message.event) {
        return message.event;
    }

    return undefined;
};

module.exports = reduceRouteKey;
