'use strict';

const Helpers = require('../../../lib/helpers');
const Code = require('@hapi/code');

const expect = Code.expect;

const assertValidateLoggerContract = (logger, expectation, callback) => {

    const result = Helpers.validateLoggerContract(logger);

    expect(result).to.be.equal(expectation);

    callback();
};

module.exports = assertValidateLoggerContract;
