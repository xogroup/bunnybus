'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { SubscriptionManager } = require('../../../lib/states');

const { describe, before, beforeEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('state management', () => {
    describe('SubscriptionManager', () => {
        let instance = undefined;

        before(() => {
            instance = new SubscriptionManager();
        });

        beforeEach(() => {
            instance._subscriptions.clear();
            instance._blockQueues.clear();
        });

        describe('create', () => {
            const baseQueueName = 'subscription-createSubscription';

            it('should create one if it does not exist', () => {
                const queueName = `${baseQueueName}-1`;
                const handlers = { event1: () => {} };
                const options = {};

                const response = instance.create(queueName, handlers, options);
                const sut = instance._subscriptions.get(queueName);

                expect(response).to.be.true();
                expect(sut).to.exist();
                expect(sut.handlers).to.exist();
                expect(sut.handlers.event1).to.be.a.function();
                expect(sut.options).to.exist();
            });

            it('should not create one if it does exist', () => {
                const queueName = `${baseQueueName}-2`;
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.create(queueName, handlers, options);

                expect(response).to.be.false();
            });

            it('should subscribe to `subscription.created` event', async () => {
                await new Promise((resolve) => {
                    const queueName = `${baseQueueName}-3`;
                    const handlers = { event1: () => {} };
                    const options = {};

                    instance.once(SubscriptionManager.CREATED_EVENT, (subcription) => {
                        expect(subcription).to.exist();
                        expect(subcription.handlers).to.exist();
                        expect(subcription.handlers.event1).to.be.a.function();
                        expect(subcription.options).to.exist();

                        resolve();
                    });

                    instance.create(queueName, handlers, options);
                });
            });
        });

        describe('tag', () => {
            const baseQueueName = 'subscription-tagSubscription';

            it('should return true when subscription exist', () => {
                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.tag(queueName, consumerTag);
                const sut = instance._subscriptions.get(queueName).hasOwnProperty('consumerTag');

                expect(response).to.be.true();
                expect(sut).to.be.true();
            });

            it('should return false when subscription does not exist', () => {
                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';

                const response = instance.tag(queueName, consumerTag);

                expect(response).to.be.false();
            });

            it('should subscribe to `subscription.tagged` event', async () => {
                await new Promise((resolve) => {
                    const queueName = `${baseQueueName}-3`;
                    const consumerTag = 'abcdefg012345';
                    const handlers = { event1: () => {} };
                    const options = {};

                    instance.once(SubscriptionManager.TAGGED_EVENT, (subcription) => {
                        expect(subcription).to.exist();
                        expect(subcription.consumerTag).to.be.equal(consumerTag);
                        expect(subcription.handlers).to.exist();
                        expect(subcription.handlers.event1).to.be.a.function();
                        expect(subcription.options).to.exist();

                        resolve();
                    });

                    instance.create(queueName, handlers, options);
                    instance.tag(queueName, consumerTag);
                });
            });
        });

        describe('get', () => {
            const baseQueueName = 'subscription-getSubscription';

            it('should return a subscription when it exist', () => {
                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const sut = instance.get(queueName);

                expect(sut).to.exist();
                expect(sut.consumerTag).to.be.equal(consumerTag);
                expect(sut.handlers).to.exist();
                expect(sut.handlers.event1).to.be.a.function();
                expect(sut.options).to.exist();
            });

            it('should return undefined when it does not exist', () => {
                const queueName = `${baseQueueName}-2`;
                const sut = instance.get(queueName);

                expect(sut).to.be.undefined();
            });
        });

        describe('clear', () => {
            const baseQueueName = 'subscription-clearSubscription';

            it('should return true when subscription is cleared', () => {
                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const response = instance.clear(queueName);
                const sut = instance._subscriptions.get(queueName).hasOwnProperty('consumerTag');

                expect(response).to.be.true();
                expect(sut).to.be.false();
            });

            it('should return false when subscription exist but does not have a consumerTag', () => {
                const queueName = `${baseQueueName}-2`;
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.clear(queueName);

                expect(response).to.be.false();
            });

            it('should return false when subscription does not exist', () => {
                const queueName = `${baseQueueName}-3`;

                const response = instance.clear(queueName);

                expect(response).to.be.false();
            });

            it('should subscribe to `subscription.cleared` event', async () => {
                await new Promise((resolve) => {
                    const queueName = `${baseQueueName}-4`;
                    const consumerTag = 'abcdefg012345';
                    const handlers = { event1: () => {} };
                    const options = {};

                    instance.once(SubscriptionManager.CLEARED_EVENT, (subcription) => {
                        expect(subcription).to.exist();

                        resolve();
                    });

                    instance.create(queueName, handlers, options);
                    instance.tag(queueName, consumerTag);
                    instance.clear(queueName);
                });
            });
        });

        describe('clearAll', () => {
            const baseQueueName = 'subscription-clearAllSubscription';

            it('should return true when subscription is cleared', async () => {
                await new Promise((resolve) => {
                    const handlers = { event1: () => {} };
                    const options = {};
                    const iterationLimit = 5;
                    let iterationCount = 0;

                    for (let i = 1; i <= iterationLimit; ++i) {
                        const queueName = `${baseQueueName}-${i}`;
                        const consumerTag = `abcdefg012345-${1}`;
                        instance.create(queueName, handlers, options);
                        instance.tag(queueName, consumerTag);
                    }

                    const eventHandler = (subscription) => {
                        ++iterationCount;

                        expect(subscription).to.exist();

                        if (iterationCount === iterationLimit) {
                            instance.removeListener(SubscriptionManager.CLEARED_EVENT, eventHandler);

                            resolve();
                        }
                    };

                    instance.on(SubscriptionManager.CLEARED_EVENT, eventHandler);
                    instance.clearAll();
                });
            });
        });

        describe('contains', () => {
            const baseQueueName = 'subscription-contains';

            it('should return false when subscription does not exist', () => {
                const queueName = `${baseQueueName}-1`;

                const response = instance.contains(queueName);

                expect(response).to.be.false();
            });

            it('should return true when subscription does exist', () => {
                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const response = instance.contains(queueName);

                expect(response).to.be.true();
            });

            it('should return true when subscription does exist with removed consumerTag when using flag override', () => {
                const queueName = `${baseQueueName}-3`;
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.contains(queueName, false);

                expect(response).to.be.true();
            });
        });

        describe('remove', () => {
            const baseQueueName = 'subscription-removeSubscription';

            it('should return false when subscription does not exist', () => {
                const queueName = `${baseQueueName}-1`;

                const response = instance.remove(queueName);

                expect(response).to.be.false();
            });

            it('should return true when subscription exist', () => {
                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const response = instance.remove(queueName);

                expect(response).to.be.true();
            });

            it('should return true when subscription exist with no consumerTag', () => {
                const queueName = `${baseQueueName}-2`;
                const handlers = { event1: () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.remove(queueName);

                expect(response).to.be.true();
            });

            it('should subscribe to `subscription.removed` event', async () => {
                await new Promise((resolve) => {
                    const queueName = `${baseQueueName}-4`;
                    const handlers = { event1: () => {} };
                    const options = {};

                    instance.once(SubscriptionManager.REMOVED_EVENT, (subscription) => {
                        expect(subscription).to.exist();

                        resolve();
                    });

                    instance.create(queueName, handlers, options);
                    instance.remove(queueName);
                });
            });
        });

        describe('list', () => {
            const baseQueueName = 'subscription-listSubscription';

            it('should return 3 records when 3 were added', () => {
                for (let i = 1; i <= 3; ++i) {
                    const queueName = `${baseQueueName}-${i}`;
                    const handlers = { event1: () => {} };
                    const options = {};

                    instance.create(queueName, handlers, options);
                }

                const results = instance.list();

                expect(results).to.have.length(3);
            });
        });

        describe('block/unblock/isBlocked', () => {
            it('should be true when blocking queue is unique', () => {
                const queueName = 'queue1';

                const result = instance.block(queueName);

                expect(result).to.be.true();
            });

            it('should be false when blocking queue is not unique', () => {
                const queueName = 'queue2';

                instance.block(queueName);
                const result = instance.block(queueName);

                expect(result).to.be.false();
            });

            it('should be true when unblocking queue exist', () => {
                const queueName = 'queue3';

                instance.block(queueName);
                const result = instance.unblock(queueName);

                expect(result).to.be.true();
            });

            it('should be false when unblocking queue does not exist', () => {
                const queueName = 'queue4';

                const result = instance.unblock(queueName);

                expect(result).to.be.false();
            });

            it('should subscribe to `subscription.blocked` event', async () => {
                await new Promise((resolve) => {
                    const queueName = 'queue5';

                    instance.once(SubscriptionManager.BLOCKED_EVENT, (queue) => {
                        expect(queue).to.be.equal(queueName);

                        resolve();
                    });

                    instance.block(queueName);
                });
            });

            it('should subscribe to `subscription.unblocked` event', async () => {
                await new Promise((resolve) => {
                    const queueName = 'queue6';

                    instance.once(SubscriptionManager.UNBLOCKED_EVENT, (queue) => {
                        expect(queue).to.be.equal(queueName);

                        resolve();
                    });

                    instance.block(queueName);
                    instance.unblock(queueName);
                });
            });

            it('should be true when block queue exist', () => {
                const queueName = 'queue7';

                instance.block(queueName);
                const result = instance.isBlocked(queueName);

                expect(result).to.be.true();
            });

            it('should be false when block queue does not exist', () => {
                const queueName = 'queue8';

                const result = instance.isBlocked(queueName);

                expect(result).to.be.false();
            });
        });
    });
});
