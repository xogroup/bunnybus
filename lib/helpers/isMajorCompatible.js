'use strict';

const semverMatch = require('./getPackageData')().semverMatch;

const isMajorCompatible = (version, range) => {
    if (!range) {
        range = semverMatch;
    }

    return version.split('.', 1)[0] === range.split('.', 1)[0];
};

module.exports = isMajorCompatible;
