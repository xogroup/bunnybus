'use strict';

const Exceptions = require('../exceptions');
const CoercePayload = require('./coercePayload');

const parsePayload = (payload, normalizeMessages = false) => {

    if ( normalizeMessages ) {
        payload = CoercePayload(payload);
    }

    if ( payload.properties.headers === undefined ) {
        throw new Exceptions.NoHeaderFieldError('No header field on incoming message, refusing to parse.');
    }

    return {
        message: payload.properties.headers.isBuffer ? payload.content : JSON.parse(payload.content.toString()),
        metaData: {
            headers: Object.assign({}, payload.properties.headers)
        }
    };
};

module.exports = parsePayload;
