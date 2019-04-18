'use strict';

const Crypto = require('crypto');

const createTransactionId = () =>
    new Promise((resolve) =>
        setImmediate(() => resolve(Crypto.randomBytes(20).toString('hex')))
    );

module.exports = createTransactionId;
