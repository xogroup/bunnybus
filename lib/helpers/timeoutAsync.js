'use strict';

const timeoutAsync = (asyncFunc, timeout = 100) => {

    return async (...args) => {

        let handled = false;

        return new Promise(async (resolve, reject) => {

            setTimeout(() => {

                if (!handled) {
                    handled = true;
                    reject(new Error('Timeout occurred'));
                }
            }, timeout);

            const result = await asyncFunc(...args);

            if (!handled) {
                handled = true;
                resolve(result);
            }
        });
    };
};

module.exports = timeoutAsync;
