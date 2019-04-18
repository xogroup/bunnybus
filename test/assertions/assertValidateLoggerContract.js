'use strict';

const Helpers = require('../../lib/helpers');
const { expect } = require('@hapi/code');

const assertValidateLoggerContract = (logger, expectation) => {
    const result = Helpers.validateLoggerContract(logger);

    expect(result).to.be.equal(expectation);
};

module.exports = assertValidateLoggerContract;
