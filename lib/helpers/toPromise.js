'use strict';

const toPromise = (promise, method, ...args) => {

    return new promise((resolve, reject) => {

        args.push((err, data) => {

            if (err) {
                return reject(err);
            }

            return resolve(data);
        });

        return method(...args);
    });
};

module.exports = toPromise;
