'use strict';

const parsePayload = ({ content = null, properties: { headers = {} } = {} }) => {
    let result = null;

    try {
        result = {
            message: headers.isBuffer ? content : JSON.parse(content.toString()),
            metaData: {
                headers: Object.assign({}, headers)
            }
        };
    } catch (err) {}

    return result;
};

module.exports = parsePayload;
