'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { Dispatcher } = require('../../lib/states');

const { describe, beforeEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('state management', () => {

    describe('Dispatcher', () => {

        let instance = undefined;
        const queueName = 'test-queue';

        beforeEach(async () => {

            instance = new Dispatcher();
        });

        describe('push', () => {

            it('should add a new function to the queue and execute', async () => {

                let delegate = null;

                const promise = new Promise((resolve) => {

                    delegate = resolve;
                });

                instance.push(queueName, delegate);

                const sut = instance._queues.get(queueName);

                await promise;

                expect(sut)
                    .to.exist()
                    .and.to.be.an.object();
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

            it('should add 50 functions and execute them in the order they were added', { timeout: 20000 }, async () => {

                const target = 50;
                let counter = 0;
                const randomNumber = (min = 20, max = 250) => Math.floor(Math.random() * (max - min + 1) + min);

                await new Promise((resolve, reject) => {

                    const delegate = async function (orderNumber) {

                        const waitTimeInMs = randomNumber();

                        // we add this timeout to force indeterministic behavior for function
                        // invokers that do not correctly handle asynchronous functions.
                        await new Promise((handlerResolve) => setTimeout(handlerResolve, waitTimeInMs));

                        if (counter !== orderNumber) {
                            reject(new Error('Messages are out of order'));
                        }

                        if (counter === (target - 1) && counter === orderNumber) {
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
                expect(instance._queues.size).to.equal(0);
            });
        });
    });
});
