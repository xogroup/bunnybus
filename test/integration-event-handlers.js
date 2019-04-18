'use strict';

const { expect } = require('@hapi/code');

const {
    before,
    beforeEach,
    after,
    afterEach,
    describe,
    it
} = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../lib');

let instance;

describe('positive integration tests - event handlers', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('blocked', () => {
        const queueName = 'test-event-handlers-blocked-queue-1';

        beforeEach(async () => {
            const handlers = {
                'subscribed-event': (
                    consumedMessage,
                    ack,
                    reject,
                    requeue
                ) => {}
            };

            await instance.subscribe(queueName, handlers);
        });

        afterEach(async () => {
            await instance.subscriptions._subscriptions.clear();
            await instance.subscriptions._blockQueues.clear();
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
        });

        it('should cause `unsubscribed()` to be called', async () => {
            await new Promise(async (resolve) => {
                instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {
                    expect(queue).to.be.equal(queueName);
                    resolve();
                });

                await instance.subscriptions.block(queueName);
            });
        });
    });

    describe('unblocked', () => {
        const queueName = 'test-event-handlers-unblocked-queue-1';

        beforeEach(() => {
            const handlers = {
                'subscribed-event': (
                    consumedMessage,
                    ack,
                    reject,
                    requeue
                ) => {}
            };

            instance.subscriptions.create(queueName, null, handlers);
            instance.subscriptions._blockQueues.add(queueName);
        });

        afterEach(async () => {
            try {
                const { consumerTag } = instance.subscriptions.get(queueName);
                await instance.channel.cancel(consumerTag);
            }
            catch (error) {}

            instance.subscriptions._subscriptions.clear();
            instance.subscriptions._blockQueues.clear();
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
        });

        it('should cause `subscribed()` to be called', async () => {
            await new Promise((resolve) => {
                instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {
                    expect(queue).to.be.equal(queueName);
                    resolve();
                });

                instance.subscriptions.unblock(queueName);
            });
        });
    });
});
