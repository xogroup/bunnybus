'use strict';

const toPromise = (instance, method, ...args) => {

    const PromiseImplementation = instance.promise;

    return new PromiseImplementation((resolve, reject) => {

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
