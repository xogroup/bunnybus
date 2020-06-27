'use strict';

const Helpers = require('../../../lib/helpers');
const Code = require('@hapi/code');

const expect = Code.expect;

const assertValidateLoggerContract = async (logger, expectation) => {
    const result = Helpers.validateLoggerContract(logger);

    expect(result).to.be.equal(expectation);
};

module.exports = assertValidateLoggerContract;
