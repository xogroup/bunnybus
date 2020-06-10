'use strict';

const timeoutAsync = (asyncFunc, timeout = 100) => {
    return async (...args) => {
        let handled = false;

        return new Promise(async (resolve, reject) => {
            const timeoutRef = setTimeout(() => {
                handled = true;
                reject(new Error('Timeout occurred'));
            }, timeout);

            try {
                const result = await asyncFunc(...args);

                if (!handled) {
                    clearTimeout(timeoutRef);
                    resolve(result);
                }
            } catch (err) {
                clearTimeout(timeoutRef);
                reject(err);
            }
        });
    };
};

module.exports = timeoutAsync;
