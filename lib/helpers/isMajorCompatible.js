'use strict';

const { semverMatch } = require('./getPackageData')();

const isMajorCompatible = (version, range = semverMatch) =>
    version.split('.', 1)[0] === range.split('.', 1)[0];

module.exports = isMajorCompatible;
