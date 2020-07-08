'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    describe('events', () => {
        before(async () => {
            instance = new BunnyBus();
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionManager = instance.connections;
            channelManager = instance.channels;
        });

        describe('messaged requeued', () => {
            const baseChannelName = 'bunnybus-events-message-requeued';
            const baseQueueName = 'test-events-message-requeued-queue';

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);

                await instance.stop();
            });

            afterEach(async () => {
                await channelContext.channel.cancel(instance.subscriptions.get(baseQueueName).consumerTag);

                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
            });

            it('should emit MESSAGE_REQUEUED_EVENT when message is requeued', async () => {
                const routeKey = 'subscribed-message-requeued-event';
                const message = { event: routeKey, foo: 'bar' };
                const transactionId = 'foo-789-xyz';
                const handlers = {};
                handlers[routeKey] = async ({ requeue }) => await requeue();

                const promise = new Promise((resolve) => {
                    const eventHandler = (sentOptions, sentMessage) => {
                        if (sentOptions.headers.routeKey === routeKey) {
                            expect(sentOptions.headers.transactionId).to.be.equal(transactionId);
                            expect(sentOptions.headers.isBuffer).to.be.false();
                            expect(sentOptions.headers.routeKey).to.equal(routeKey);
                            expect(sentOptions.headers.createdAt).to.exist();
                            expect(sentOptions.headers.requeuedAt).to.exist();
                            expect(sentOptions.headers.retryCount).to.exist();
                            expect(sentOptions.headers.bunnyBus).to.equal(require('../../../../package.json').version);
                            expect(sentMessage).to.contains(message);

                            instance.removeListener(BunnyBus.MESSAGE_REQUEUED_EVENT, eventHandler);
                            resolve();
                        }
                    };

                    instance.on(BunnyBus.MESSAGE_REQUEUED_EVENT, eventHandler);
                });

                await instance.subscribe({ queue: baseQueueName, handlers });
                await instance.publish({ message, options: { transactionId } });
                await promise;
            });
        });
    });
});
