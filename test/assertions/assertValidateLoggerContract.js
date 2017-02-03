'use strict';

const Helpers = require('../../lib/helpers');
const Code = require('code');
const expect = Code.expect;

const assertValidateLoggerContract = (logger, expectation, callback) => {

    const result = Helpers.validateLoggerContract(logger);

    expect(result).to.equal(expectation);

    callback();
};

module.exports = assertValidateLoggerContract;
