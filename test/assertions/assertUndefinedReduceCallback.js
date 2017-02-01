'use strict';

const Helpers = require('../../lib/helpers');
const Code = require('code');
const expect = Code.expect;

const assertUndefinedReduceCallback = (...args) => {

    const result = Helpers.reduceCallback.apply(this, args);

    expect(result).to.be.undefined();
};

module.exports = assertUndefinedReduceCallback;
