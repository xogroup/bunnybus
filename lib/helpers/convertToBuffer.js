'use strict';

const convertToBuffer = (content, callback) => {

    const container = {
        message : content
    };

    callback(null, new Buffer(JSON.stringify(container)));
};

module.exports = convertToBuffer;
