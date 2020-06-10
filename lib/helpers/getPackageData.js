'use strict';

const PackageMeta = require('../../package.json');

const majorSemver = PackageMeta.version.split('.', 1)[0];

const packageData = {
    name: PackageMeta.name,
    version: PackageMeta.version,
    semverMatch: `${majorSemver}.x.x`
};

const getPackageData = () => {
    return packageData;
};

module.exports = getPackageData;
