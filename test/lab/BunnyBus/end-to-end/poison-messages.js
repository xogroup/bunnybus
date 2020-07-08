'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');
const { ChannelManager } = require('../../../../lib/states');
const Helpers = require('../../../../lib/helpers');

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
            const baseChannelName = 'bunnybus-e2e-poison-messages';
            const baseQueueName = 'test-e2e-poison-messages-queue';
            const basePoisonQueueName = `${baseQueueName}_poison`;

            beforeEach(async () => {
                instance = new BunnyBus();
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
            });

            afterEach(async () => {
                await instance.unsubscribe(baseQueueName);
            });

            after(async () => {
                await channelContext.channel.deleteQueue(baseQueueName);
                await channelContext.channel.deleteQueue(basePoisonQueueName);
                await instance.stop();
            });

            it('should error when message caught by subscribe is not a deserializable JSON buffer', async () => {
                const badJSONBuffer = Buffer.from('{ "hello": "world ', 'utf-8');

                // This will never be called
                await instance.subscribe({
                    queue: baseQueueName,
                    handlers: {
                        ec: async ({ ack }) => {
                            await ack();
                        }
                    }
                });

                // send the poison message
                channelContext.channel.sendToQueue(baseQueueName, badJSONBuffer, { headers: { routeKey: 'ec' } });

                await new Promise((resolve) => {
                    instance.once(BunnyBus.MESSAGE_REJECTED_EVENT, async () => {
                        expect(await instance.get({ queue: basePoisonQueueName })).to.exist();
                        resolve();
                    });
                });
            });

            it('should not error when message caught by subscribe is not a deserializable JSON buffer when "rejectPoisonMessages" is false', async () => {
                const badJSONBuffer = Buffer.from('{ "hello": "world ', 'utf-8');

                // This will never be called
                await instance.subscribe({
                    queue: baseQueueName,
                    handlers: {
                        ec: async ({ ack }) => {
                            await ack();
                        }
                    },
                    options: { rejectPoisonMessages: false }
                });

                // send the poison message
                channelContext.channel.sendToQueue(baseQueueName, badJSONBuffer, { headers: { routeKey: 'ec' } });

                await expect(
                    Helpers.timeoutAsync(
                        async () =>
                            await new Promise((resolve) => {
                                instance.once(BunnyBus.MESSAGE_REJECTED_EVENT, async () => {
                                    expect(await instance.get({ queue: basePoisonQueueName })).to.exist();
                                    resolve();
                                });
                            }),
                        1500
                    )()
                ).to.reject(Error, 'Timeout occurred');
            });
        });
    });
});
