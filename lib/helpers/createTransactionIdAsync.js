'use strict';

const Crypto = require('crypto');

const createTransactionIdAsync = async () => {

    return new Promise((resolve, reject) => {

        setImmediate(() => {

            try {
                const hash = Crypto.randomBytes(20).toString('hex');
                resolve(hash);
            }
            catch (err) {
                reject(err);
            }
        });
    });
};

module.exports = createTransactionIdAsync;
