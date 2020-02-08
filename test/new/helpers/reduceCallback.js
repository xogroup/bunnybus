'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

const callback = () => {};

describe('Helpers', () => {

    describe('reduceCallback', () => {

        it('should return callback when given (callback)', () => {

            Assertions.assertReduceCallback(callback);
        });

        it('should return callback when given ({}, callback)', () => {

            Assertions.assertReduceCallback({}, callback);
        });

        it('should return callback when given (undefined, callback)', () => {

            Assertions.assertReduceCallback(undefined, callback);
        });

        it('should return callback when given (null, callback)', () => {

            Assertions.assertReduceCallback(null, callback);
        });

        it('should return callback when given ({}, null, callback)', () => {

            Assertions.assertReduceCallback({}, null, callback);
        });

        it('should return undefined when given ({})', () => {

            Assertions.assertUndefinedReduceCallback({});
        });

        it('should return undefined when given (undefined, undefined)', () => {

            Assertions.assertUndefinedReduceCallback(undefined, undefined);
        });

        it('should return undefined when given ()', () => {

            Assertions.assertUndefinedReduceCallback();
        });
    });
});
