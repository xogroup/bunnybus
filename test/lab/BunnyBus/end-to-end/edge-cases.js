'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');
const { ChannelManager } = require('../../../../lib/states');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
const connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    describe('end to end behaviors', () => {
        describe('edge cases', () => {
            const baseChannelName = 'bunnybus-e2e-edge-cases';
            const baseQueueName = 'test-e2e-edge-cases-queue';

            beforeEach(async () => {
                instance = new BunnyBus();
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await new Promise(async (resolve) => {
                    channelManager.once(ChannelManager.CHANNEL_REMOVED, resolve);
                    await connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            after(async () => {
                if (!channelContext.channel) {
                    // We need this to clean up bad configuration induced by edge case testing
                    instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                    channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                }

                await channelContext.channel.deleteQueue(baseQueueName);
                await instance.stop();
            });

            it('should pass when parallel calls to publish happens when connection starts off closed', async () => {
                const message = { event: 'ee', name: 'bunnybus' };

                await Promise.all([instance.publish({ message }), instance.publish({ message }), instance.publish({ message })]);
            });

            it('should pass when send pushes a message to a subscribed queue', async () => {
                const message = { event: 'ea', name: 'bunnybus' };

                await new Promise(async (resolve) => {
                    const handlers = {
                        ea: async ({ message: subscribedMessaged, ack }) => {
                            expect(subscribedMessaged).to.be.equal(message);

                            await ack();
                            await instance.deleteQueue({ queue: baseQueueName });
                            resolve();
                        }
                    };

                    await instance.createQueue({ name: baseQueueName });
                    await instance.send({ message, queue: baseQueueName });
                    await instance.subscribe({ queue: baseQueueName, handlers });
                });
            });

            it('should error when server host configuration value is not valid', async () => {
                const message = { event: 'eb', name: 'bunnybus' };
                instance.config = {
                    hostname: 'fake',
                    timeout: 300,
                    connectionRetryCount: 1
                };

                await expect(instance.publish({ message })).to.reject();
            });
        });
    });
});
