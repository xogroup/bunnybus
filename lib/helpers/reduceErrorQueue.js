'use strict';

const IsString = require('./isString');

const string = (value) => (IsString(value) ? value : undefined);

const reduceErrorQueue = (defaultQueue, globalQueue, localQueue) => {
    return string(localQueue) || string(globalQueue) || string(defaultQueue);
};

module.exports = reduceErrorQueue;
