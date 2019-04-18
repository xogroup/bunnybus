'use strict';

const PackageMeta = require('../../package.json');

const majorSemver = PackageMeta.version.split('.', 1)[0];

const getPackageData = () => ({
    name: PackageMeta.name,
    version: PackageMeta.version,
    semverMatch: `${majorSemver}.x.x`
});

module.exports = getPackageData;
