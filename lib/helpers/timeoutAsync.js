'use strict';

const timeoutAsync = (asyncFunc, timeout = 100) => {
    return async (...args) => {
        return new Promise(async (resolve, reject) => {
            const timeoutRef = setTimeout(() => {
                reject(new Error('Timeout occurred'));
            }, timeout);

            try {
                const result = await asyncFunc(...args);

                clearTimeout(timeoutRef);
                resolve(result);
            } catch (err) {
                clearTimeout(timeoutRef);
                reject(err);
            }
        });
    };
};

module.exports = timeoutAsync;
