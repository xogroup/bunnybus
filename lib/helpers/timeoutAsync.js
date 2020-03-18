'use strict';

const timeoutAsync = (asyncFunc, timeout = 100) => {

    return async (...args) => {

        let handled = false;

        return new Promise(async (resolve, reject) => {

            const timeoutRef = setTimeout(() => {

                if (!handled) {
                    handled = true;
                    reject(new Error('Timeout occurred'));
                }
            }, timeout);

            try {
                const result = await asyncFunc(...args);

                if (!handled) {
                    clearTimeout(timeoutRef);
                    handled = true;
                    resolve(result);
                }
            }
            catch (err) {
                if (!handled) {
                    clearTimeout(timeoutRef);
                    handled = true;
                    reject(err);
                }
            }
        });
    };
};

module.exports = timeoutAsync;
