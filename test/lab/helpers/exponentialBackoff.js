'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('exponentialBackoff', () => {
        it('should not return a backoff value limited by the ceiling within jitter range', async () => {
            const result = Helpers.exponentialBackoff(1);
            expect(result - 50).to.be.between(0, 2000);
        });

        it('should return a backoff value limited by the ceiling within jitter range', async () => {
            const result = Helpers.exponentialBackoff(9);
            expect(result - 10000).to.be.between(0, 2000);
        });
    });
});
