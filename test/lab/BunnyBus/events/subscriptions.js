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

        describe('subscriptions', () => {
            const baseChannelName = 'bunnybus-events-subscriptions';
            const baseQueueName = 'test-events-subscriptions-queue';

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
            });

            afterEach(async () => {
                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
            });

            after(async () => {
                await instance.stop();
            });

            it('should emit UNSUBSCRIBED_EVENT when queue is blocked', async () => {
                await instance.subscribe({
                    queue: baseQueueName,
                    handlers: {
                        'subscribed-event': () => {}
                    }
                });

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
                await instance.subscriptions.create(baseQueueName, {
                    'subscribed-event': () => {}
                });
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
    });
});
