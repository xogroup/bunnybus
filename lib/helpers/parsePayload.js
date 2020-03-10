'use strict';

const parsePayload = (payload) => {

    const buf = Buffer.from(payload.content);
    return {
        message : payload.properties.headers.isBuffer ? buf : JSON.parse(buf.toString()),
        metaData : {
            headers : Object.assign({}, payload.properties.headers)
        }
    };
};

module.exports = parsePayload;
