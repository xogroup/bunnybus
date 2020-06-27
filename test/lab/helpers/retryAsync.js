'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let i = undefined;

describe('Helpers', () => {
    describe('retryAsync', () => {
        beforeEach(() => {
            i = 0;
        });

        it('should run once', async () => {
            expect(
                await Helpers.retryAsync(async () => {
                    return ++i;
                })
            ).to.equal(1);
        });

        it('should run twice with no errors', async () => {
            expect(
                await Helpers.retryAsync(async () => {
                    if (++i < 2) {
                        throw new Error();
                    }

                    return i;
                })
            ).to.equal(2);
        });

        it('should take longer to run when interval is set with larger wait duration', async () => {
            const startTime = new Date();
            let endTimeX;
            let endTimeY;
            let x;
            let y = 0;

            await Promise.all([
                Helpers.retryAsync(async () => {
                    if (++x < 2) {
                        throw new Error();
                    }

                    endTimeX = new Date();
                }, 100),
                Helpers.retryAsync(async () => {
                    if (++y < 2) {
                        throw new Error();
                    }

                    endTimeY = new Date();
                }, 1000)
            ]);

            const diffTimeX = endTimeX.getTime() - startTime.getTime();
            const diffTimeY = endTimeY.getTime() - startTime.getTime();

            expect(diffTimeX).to.be.below(diffTimeY);
        });

        it('should run with interval supplied as a function', async () => {
            let dynamicIntervalResult = 0;

            const result = await Helpers.retryAsync(
                async () => {
                    if (++i < 3) {
                        throw new Error();
                    }

                    return i;
                },
                (retryCount) => {
                    dynamicIntervalResult = 50 * Math.pow(2, retryCount);
                    return dynamicIntervalResult;
                }
            );

            expect(result).to.equal(3);
            expect(dynamicIntervalResult).to.equal(200);
        });

        it('should error when attempt limits are reached', async () => {
            let result = null;

            try {
                await Helpers.retryAsync(
                    async () => {
                        ++i;
                        throw new Error();
                    },
                    100,
                    2
                );
            } catch (err) {
                result = err;
            }

            expect(i).to.equal(2);
            expect(result).to.be.an.error(Error, 'Exceeded maximum attempts of retries of 2');
        });

        it('should error when error filter trips', async () => {
            let result = null;

            try {
                await Helpers.retryAsync(
                    async () => {
                        throw new Error();
                    },
                    100,
                    2,
                    () => {
                        return true;
                    }
                );
            } catch (err) {
                result = err;
            }

            expect(result).to.be.an.error(Error, 'Error Filter tripped');
        });
    });
});
