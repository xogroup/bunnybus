'use strict';

const convertToBufferAsync = async (content) => {

    return new Promise((resolve, reject) => {

        setImmediate(() => {

            try {
                const isBuffer = Buffer.isBuffer(content);

                const result = {
                    isBuffer,
                    buffer: isBuffer
                        ? content
                        : Buffer.from(JSON.stringify(content))
                };

                resolve(result);
            }
            catch (err) {
                reject(err);
            }
        });
    });
};

module.exports = convertToBufferAsync;
