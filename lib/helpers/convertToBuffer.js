'use strict';

const convertToBuffer = (content, callback) => {

    setImmediate(() => {

        const result = {
            isBuffer : Buffer.isBuffer(content),
            buffer : content
        };

        if (!result.isBuffer) {
            result.buffer = Buffer.from(JSON.stringify(content));
        }

        callback(null, result);
    });
};

module.exports = convertToBuffer;
