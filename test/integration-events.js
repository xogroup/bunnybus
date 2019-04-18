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

describe('positive integration tests - events', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('recovering', () => {
        beforeEach(async () => {
            await instance._autoConnectChannel();
        });

        it('should be evented when connection was closed and is recovering', async () => {
            await new Promise((resolve) => {
                instance.once(BunnyBus.RECOVERING_EVENT, resolve);
                instance.connection.emit('close');
            });
        });

        it('should be evented when channel was closed and is recovering', async () => {
            await new Promise((resolve) => {
                instance.once(BunnyBus.RECOVERING_EVENT, resolve);
                instance.channel.emit('close');
            });
        });
    });

    describe('recovered', () => {
        before(async () => {
            await instance._autoConnectChannel();
        });

        it('should be evented when connection was closed and is recovering', async () => {
            await new Promise((resolve) => {
                instance.once(BunnyBus.RECOVERED_EVENT, resolve);
                instance.connection.emit('close');
            });
        });

        it('should be evented when channel was closed and is recovering', async () => {
            await new Promise((resolve) => {
                instance.once(BunnyBus.RECOVERED_EVENT, resolve);
                instance.channel.emit('close');
            });
        });
    });

    describe('published', () => {
        const message = { event: 'published-event', name: 'bunnybus' };

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
        });

        it('should be evented when message is published', async () => {
            await new Promise(async (resolve) => {
                instance.once(BunnyBus.PUBLISHED_EVENT, (sentMessage) => {
                    expect(sentMessage).to.be.equal(message);
                    resolve();
                });

                await instance.publish(message);
            });
        });
    });

    describe('subcribed', () => {
        const queueName = 'test-event-subscribed-queue-1';

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
        });

        afterEach(async () => {
            const { consumerTag } = instance.subscriptions.get(queueName);

            try {
                await instance.channel.cancel(consumerTag);
            }
            catch (error) {}

            instance.subscriptions._subscriptions.clear();
            instance.subscriptions._blockQueues.clear();
        });

        it('should be evented when queue is subscribed', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    'subscribed-event': (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {}
                };

                instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {
                    expect(queue).to.be.equal(queueName);
                    resolve();
                });

                await instance.subscribe(queueName, handlers);
            });
        });
    });

    describe('unsubscribed', () => {
        const queueName = 'test-event-unsubscribed-queue-1';

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

        it('should be evented when queue is unsubscribed', async () => {
            await new Promise(async (resolve) => {
                instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {
                    expect(queue).to.be.equal(queueName);
                    resolve();
                });

                await instance.unsubscribe(queueName);
            });
        });
    });
});
