'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('public methods', () => {
        describe('resubscribe / unsubscribe (single queue)', () => {
            const baseChannelName = 'bunnybus-resubscribe';
            const baseQueueName = 'test-resubscribe-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const messageObject = { event: 'a.b', name: 'bunnybus' };
            const messageString = 'bunnybus';

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
            });

            afterEach(async () => {
                await instance.unsubscribe({ queue: baseQueueName });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await instance.stop();
            });

            it('should consume message (Object) from queue and acknowledge off', async () => {
                return new Promise(async (resolve) => {
                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers: {
                            [messageObject.event]: async ({ message: consumedMessage, ack }) => {
                                expect(consumedMessage).to.be.equal(messageObject);

                                await ack();
                                resolve();
                            }
                        }
                    });
                    await instance.unsubscribe({ queue: baseQueueName });
                    await instance.resubscribe({ queue: baseQueueName });
                    await instance.publish({ message: messageObject });
                });
            });

            it('should not reject when handler subscription exist', async () => {
                return new Promise(async (resolve) => {
                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers: {
                            [messageObject.event]: async ({ message: consumedMessage, ack }) => {
                                expect(consumedMessage).to.be.equal(messageObject);

                                await ack();
                                resolve();
                            }
                        }
                    });
                    await expect(instance.resubscribe({ queue: baseQueueName })).to.not.reject();
                    await instance.publish({ message: messageObject });
                });
            });
        });
    });
});
