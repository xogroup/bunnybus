'use strict';

/*
 * Exponential Backoff Helper
 * Backoff up to a maximum ceiling
 * Add pseudo-random jitter to help prevent reconnect floods
 */
module.exports = function (retryCount) {
    const nextInterval = 25 * Math.pow(2, retryCount);
    const jitter = Math.floor(Math.random() * 2000);
    if (nextInterval > 10000) {
        return 10000 + jitter;
    }

    return nextInterval + jitter;
};
