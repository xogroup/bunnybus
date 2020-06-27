'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { ConcurrentDispatcher } = require('../../../lib/schedulers');

const { describe, beforeEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('schedulers', () => {
    describe('Concurrent Dispatcher', () => {
        let instance = undefined;
        const queueName = 'test-concurrent-dispatch-queue';

        beforeEach(async () => {
            instance = new ConcurrentDispatcher();
        });

        describe('push', () => {
            it('should add a new function and execute', async () => {
                let delegate = null;

                const promise = new Promise((resolve) => {
                    delegate = resolve;
                });

                instance.push(queueName, delegate);

                await promise;
            });

            it('should add 3 functions to the queue and execute', async () => {
                let counter = 0;

                await new Promise((resolve) => {
                    const delegate = async () => {
                        if (++counter === 3) {
                            resolve();
                        }
                    };

                    instance.push(queueName, delegate);
                    instance.push(queueName, delegate);
                    instance.push(queueName, delegate);
                });

                expect(counter).to.equal(3);
            });

            it('should add 50 functions and execute them in any order', async () => {
                const target = 50;
                let counter = 0;
                let outOfOrderCaptured = false;
                const randomNumber = (min = 20, max = 250) => Math.floor(Math.random() * (max - min + 1) + min);

                await new Promise((resolve, reject) => {
                    const delegate = async function (orderNumber) {
                        const waitTimeInMs = randomNumber();

                        // we add this timeout to force indeterministic behavior for function
                        // invokers that do not correctly handle asynchronous functions.
                        await new Promise((handlerResolve) => setTimeout(handlerResolve, waitTimeInMs));

                        if (counter !== orderNumber) {
                            outOfOrderCaptured = true;
                        }

                        if (counter === target - 1) {
                            resolve();
                        }

                        counter++;
                    };

                    for (let i = 0; i < target; ++i) {
                        // eslint-disable-next-line no-loop-func
                        ((orderNumber) => {
                            instance.push(queueName, delegate.bind(null, orderNumber));
                        })(i);
                    }
                });

                expect(counter).to.equal(target);
                expect(outOfOrderCaptured).to.be.true();
            });
        });
    });
});
