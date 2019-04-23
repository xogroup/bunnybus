'use strict';

const parsePayload = (payload) => {
    const {
        properties: { headers },
        content
    } = payload;
    const { isBuffer } = headers;

    const message = isBuffer ? content : JSON.parse(content.toString());
    return {
        message,
        metaData: {
            headers: { ...headers }
        }
    };
};

module.exports = parsePayload;
