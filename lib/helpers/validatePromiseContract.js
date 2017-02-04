'use strict';

const validatePromiseContract = function (promiseImplementation) {

    let resolve;
    let reject;

    const task = new promiseImplementation((res, rej) => {

        resolve = res;
        reject = rej;
    });

    if (typeof task.then !== 'function') {
        return false;
    }

    if (typeof task.catch !== 'function') {
        return false;
    }

    if (typeof resolve !== 'function' && typeof reject !== 'function') {
        return false;
    }

    return true;
};

module.exports = validatePromiseContract;
