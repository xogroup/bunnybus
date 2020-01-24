'use strict';

const retryAsync = async (asyncFunc, interval = 500, times = 100, errorFilterFunc) => {

    let isCompleted = false;
    let iteration = 0;

    do {
        ++iteration;

        try {
            return await asyncFunc();
        }
        catch (err) {

            if (errorFilterFunc) {
                isCompleted = !errorFilterFunc(err);
            }
        }

        await new Promise((resolve) => {

            setTimeout(resolve, interval);
        });
    } while (!isCompleted && iteration < times);

    if (iteration === times) {
        throw new Error('Exceeded maximum attempts of retries');
    }

    if (isCompleted) {
        throw new Error('Error Filter tripped');
    }
};

module.exports = retryAsync;
