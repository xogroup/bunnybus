'use strict';

const retryAsync = async (asyncFunc, interval = 500, times = 100, errorFilterFunc) => {
    let isCompleted = false;
    let iteration = 0;
    const intervalFunc = typeof interval === 'function' ? interval : () => interval;

    do {
        ++iteration;

        try {
            return await asyncFunc();
        } catch (err) {
            if (errorFilterFunc) {
                isCompleted = errorFilterFunc(err);
            }
        }

        // eslint-disable-next-line no-loop-func
        await new Promise((resolve) => {
            setTimeout(resolve, intervalFunc(iteration));
        });
    } while (!isCompleted && iteration < times);

    if (iteration === times) {
        throw new Error(`Exceeded maximum attempts of retries of ${times}`);
    } else {
        throw new Error('Error Filter tripped');
    }
};

module.exports = retryAsync;
