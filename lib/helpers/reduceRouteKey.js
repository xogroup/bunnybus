'use strict';

const reduceRouteKey = ({ payload, options, message } = {}) => {
    const {
        properties: { headers: { routeKey: payloadRouteKey } = {} } = {},
        fields: { routingKey } = {}
    } = payload || {};

    if (payloadRouteKey) {
        return payloadRouteKey;
    }

    const { routeKey: optionsRouteKey } = options || {};
    if (optionsRouteKey) {
        return optionsRouteKey;
    }

    const { event } = message || {};
    if (event) {
        return event;
    }

    if (routingKey) {
        return routingKey;
    }

    return undefined;
};

module.exports = reduceRouteKey;
