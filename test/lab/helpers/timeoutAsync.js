'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

const mockWorkload = async (param1) => {
    return await new Promise((resolve) => {
        setTimeout(resolve.bind(this, param1), 50);
    });
};

const mockErrorWorkload = async () => {
    throw new Error('Bad workload');
};

describe('Helpers', () => {
    describe('timeoutAsync', () => {
        it('should not error when execution is within timeout limit', async () => {
            const result = await Helpers.timeoutAsync(mockWorkload)('hello');

            expect(result).to.exist();
            expect(result).to.equal('hello');
        });

        it('should error when execution extend past timeout limit', async () => {
            let sut = null;

            try {
                await Helpers.timeoutAsync(mockWorkload, 20)('hello');
            } catch (err) {
                sut = err;
            }

            expect(sut).to.exist();
            expect(sut).to.be.an.error('Timeout occurred');
        });

        it('should error when workload errors', async () => {
            let sut = null;

            try {
                await Helpers.timeoutAsync(mockErrorWorkload, 20)();
            } catch (err) {
                sut = err;
            }

            expect(sut).to.exist();
            expect(sut).to.be.an.error('Bad workload');
        });
    });
});
