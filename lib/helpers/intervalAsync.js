'use strict';

const intervalAsync = async (asyncFunc, interval = 200) => {
    await new Promise((resolve, reject) => {
        const intervalRef = setInterval(async () => {
            try {
                if (await asyncFunc()) {
                    clearInterval(intervalRef);
                    resolve();
                }
            } catch (err) {
                reject(err);
            }
        }, interval);
    });
};

module.exports = intervalAsync;
