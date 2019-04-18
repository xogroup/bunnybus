'use strict';

const Crypto = require('crypto');

const createTransactionId = async () =>
    new Promise((resolve) =>
        setImmediate(() => resolve(Crypto.randomBytes(20).toString('hex')))
    );

module.exports = createTransactionId;
