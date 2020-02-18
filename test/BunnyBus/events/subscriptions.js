'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
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

        describe('subscriptions', () => {

            const baseChannelName = 'bunnybus-events-subscriptions';
            const baseQueueName = 'test-events-subscriptions-queue';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
            });

            afterEach(async () => {

                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
            });

            it('should emit UNSUBSCRIBED_EVENT when queue is blocked', async () => {

                await instance.subscribe(
                    baseQueueName,
                    { 'subscribed-event': async (consumedMessage, ack, reject, requeue) => {} }
                );

                await new Promise(async (resolve) => {

                    instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {

                        expect(queue).to.be.equal(baseQueueName);

                        resolve();
                    });

                    instance.subscriptions.block(baseQueueName);
                });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);
            });

            it('should emit SUBSCRIBED_EVENT when queue is unblocked', async () => {

                await instance.subscriptions.create(
                    baseQueueName,
                    { 'subscribed-event': async (consumedMessage, ack, reject, requeue) => {} }
                );
                instance.subscriptions._blockQueues.add(baseQueueName);

                await new Promise(async (resolve) => {

                    instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {

                        expect(queue).to.be.equal(baseQueueName);

                        resolve();
                    });

                    instance.subscriptions.unblock(baseQueueName);
                });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);
            });
        });

        describe('recovery', () => {

            const baseChannelName = 'bunnybus-events-recovery';
            const baseQueueName = 'test-events-recovery-queue';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
            });

            it('should emit RECOVERING_CONNECTION_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERING_CONNECTION_EVENT, resolve);

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            it('should emit RECOVERING_CHANNEL_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERING_CHANNEL_EVENT, resolve);

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            it('should emit RECOVERING_CHANNEL_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERING_CHANNEL_EVENT, resolve);

                    channelManager.close(baseChannelName);
                });
            });

            it('should emit RECOVERED_CONNECTION_EVENT when closed connection is recovered', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERED_CONNECTION_EVENT, resolve);

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });


            it('should emit RECOVERED_CHANNEL_EVENT when closed connection is recovered', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, resolve);

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            it('should emit RECOVERED_CHANNEL_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, resolve);

                    channelManager.close(baseChannelName);
                });
            });
        });
    });
});
