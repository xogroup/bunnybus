'use strict';

const convertToBuffer = (content) =>
    new Promise((resolve) =>
        setImmediate(() => {
            const result = {
                isBuffer: Buffer.isBuffer(content),
                buffer: content
            };

            if (!result.isBuffer) {
                result.buffer =  Buffer.from(JSON.stringify(content));
            }

            resolve(result);
        })
    );

module.exports = convertToBuffer;
