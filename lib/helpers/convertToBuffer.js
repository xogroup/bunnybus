'use strict';

const convertToBuffer = (content, callback) => {

    setImmediate(() => {

        callback(null, new Buffer(JSON.stringify(content)));
    });
};

module.exports = convertToBuffer;
