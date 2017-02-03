'use strict';

const validatePromiseContract = function (promiseImplementation) {

    let resolve;
    let reject;

    const task = new promiseImplementation((res, rej) => {

        resolve = res;
        reject = rej;
    });
    const isThenable = typeof task.then === 'function';
    const isCatchable = typeof task.catch === 'function';
    const isResolvable = typeof resolve === 'function' && typeof reject === 'function';

    return isResolvable && isThenable && isCatchable;
};

module.exports = validatePromiseContract;
