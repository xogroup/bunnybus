'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('isString', () => {
        it('should be true with string literal', () => {
            const result = Helpers.isString('foo');

            expect(result).to.be.true();
        });

        it('should be true with string object', () => {
            // eslint-disable-next-line no-new-wrappers
            const result = Helpers.isString(new String('foo'));

            expect(result).to.be.true();
        });

        it('should be false when undefined', () => {
            const result = Helpers.isString();

            expect(result).to.be.false();
        });

        it('should be false for a simple object', () => {
            const result = Helpers.isString({});

            expect(result).to.be.false();
        });

        it('should be false for a complex object', () => {
            const result = Helpers.isString(new Date());

            expect(result).to.be.false();
        });

        it('should be false for a function', () => {
            const result = Helpers.isString(() => {});

            expect(result).to.be.false();
        });
    });
});
