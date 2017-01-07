'use strict';

const convertToBuffer = (content, callback) => {

    setImmediate(() => {

        if (Buffer.isBuffer(content)) {
            callback(null, content);
        }
        else {
            callback(null, new Buffer(JSON.stringify(content)));
        }
    });
};

module.exports = convertToBuffer;
