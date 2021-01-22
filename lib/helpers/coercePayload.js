'use strict';

const Exceptions = require('../exceptions');

const coercePayload = (payload) => {

    const hasProperties = payload && payload.properties ? true : false;
    const hasHeaders = hasProperties && typeof payload.properties.headers === 'object' ? true : false;
    const hasContent = ( payload && payload.content && payload.content.length ) ? true : false;

    const coercedPayload = payload ? Object.assign({}, payload) : {};

    if (!hasProperties) {
        coercedPayload.properties = {};
    }

    if (!hasHeaders) {
        coercedPayload.properties.headers = {};
    }

    if (!hasContent) {
        coercedPayload.content = Buffer.alloc(0);
    }

    return coercedPayload;
};

module.exports = coercePayload;
