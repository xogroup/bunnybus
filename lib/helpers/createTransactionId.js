'use strict';

const Crypto = require('crypto');

const createTransactionId = () => Crypto.randomBytes(20).toString('hex');

module.exports = createTransactionId;
