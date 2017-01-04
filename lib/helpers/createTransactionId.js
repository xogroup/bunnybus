'use strict';

const Crypto = require('crypto');

const createTransactionId = (callback) => {

    setImmediate(() => {

        const hash = Crypto.randomBytes(20).toString('hex');

        callback(null, hash);
    });
};

module.exports = createTransactionId;
