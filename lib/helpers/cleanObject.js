'use strict';

const cleanObject = (obj) => {
    for (const key in obj) {
        if (obj[key] === undefined || obj[key] === null) {
            delete obj[key];
        } else if (obj[key] instanceof Object) {
            cleanObject(obj[key]);
        }
    }
};

module.exports = cleanObject;
