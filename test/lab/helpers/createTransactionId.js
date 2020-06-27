'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('createTransactionId', () => {
        it('should create an 40 character long alphanumeric token', async () => {
            let sut = null;

            try {
                const result = Helpers.createTransactionId();

                expect(result).to.be.a.string();
                expect(result).to.have.length(40);
                expect(result).to.match(/^([\d\w]*)$/);
            } catch (err) {
                sut = err;
            }

            expect(sut).to.not.exist();
        });

        it('should create only unique tokens', async () => {
            const iterations = 1000;

            const result = new Set();

            for (let i = 0; i < iterations; ++i) {
                result.add(Helpers.createTransactionId());
            }

            expect(result.size).to.equal(iterations);
        });
    });
});
