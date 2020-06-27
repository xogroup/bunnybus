'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('isMajorCompatible', () => {
        it('should return true when major matches', () => {
            const result = Helpers.isMajorCompatible('1.2.3', '1.x.x');

            expect(result).to.be.true();
        });

        it('should return false when major does not match', () => {
            const result = Helpers.isMajorCompatible('2.1.3', '1.x.x');

            expect(result).to.be.false();
        });

        it('should return true when using package defaults', () => {
            const result = Helpers.isMajorCompatible(require('../../../package.json').version);

            expect(result).to.be.true();
        });
    });
});
