'use strict';

const convertToBuffer = (content, callback) => {

    setImmediate(() => {

        const result = {
            isBuffer : Buffer.isBuffer(content),
            buffer : content
        };

        if (!result.isBuffer) {
            result.buffer = new Buffer(JSON.stringify(content));
        }

        callback(null, result);
    });
};

module.exports = convertToBuffer;
