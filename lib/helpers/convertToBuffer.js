'use strict';

const convertToBuffer = (content) => {
    const isBuffer = Buffer.isBuffer(content);

    const result = {
        isBuffer,
        buffer: isBuffer ? content : Buffer.from(JSON.stringify(content))
    };

    return result;
};

module.exports = convertToBuffer;
