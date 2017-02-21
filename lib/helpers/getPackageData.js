'use strict';

const PackageMeta = require('../../package.json');

const packageData = {
    name : PackageMeta.name,
    version : PackageMeta.version
};

const getPackageData = () => {

    return packageData;
};

module.exports = getPackageData;
