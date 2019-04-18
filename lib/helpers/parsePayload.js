'use strict';

const parsePayload = (payload) => ({
    message: payload.properties.headers.isBuffer
        ? payload.content
        : JSON.parse(payload.content.toString()),
    metaData: {
        headers: Object.assign({}, payload.properties.headers)
    }
});

module.exports = parsePayload;
