'use strict';

const convertToBuffer = (source) => {

    const isBuffer = Buffer.isBuffer(source);

    return {
        isBuffer,
        buffer: isBuffer
            ? source
            : Buffer.from(JSON.stringify(source))
    };
};

module.exports = convertToBuffer;
