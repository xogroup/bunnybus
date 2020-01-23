'use strict';

const promisify = (func, ...parameters) => {

    return new Promise((res, rej) => {

        const done = (err) => {

            return err
                ? rej(err)
                : res();
        };

        if (parameters.length > 0) {
            func(...parameters, done);
        }
        else {
            func(done);
        }
    });
};

module.exports = {
    Promisify: promisify
};
