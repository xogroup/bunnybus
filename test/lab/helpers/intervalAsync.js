'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let i = undefined;

describe('Helpers', () => {
    describe('intervalAsync', () => {
        beforeEach(() => {
            i = 0;
        });

        it('should run three times', async () => {
            await Helpers.intervalAsync(async () => {
                return ++i === 3;
            });

            expect(i).to.equal(3);
        });

        it('should time out', async () => {
            let result = null;

            try {
                await Helpers.timeoutAsync(Helpers.intervalAsync, 400)(async () => false, 20);
            } catch (err) {
                result = err;
            }

            expect(result).to.exist();
            expect(result).to.be.an.error('Timeout occurred');
        });

        it('should error when asyncFunc throws an error', async () => {
            let result = null;

            try {
                await Helpers.intervalAsync(async () => {
                    throw new Error('foobar');
                });
            } catch (err) {
                result = err;
            }

            expect(result).to.exist();
            expect(result).to.be.an.error('foobar');
        });
    });
});
