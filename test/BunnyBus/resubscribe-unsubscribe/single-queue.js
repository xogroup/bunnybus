'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

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
            const publishOptions = { routeKey: 'a.b' };
            const subscribeOptionsWithMeta = { meta: true };
            const messageObject = { event: 'a.b', name: 'bunnybus' };
            const messageString = 'bunnybus';
            const messageBuffer = Buffer.from(messageString);

            before(async () => {
                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
            });

            afterEach(async () => {
                await instance.unsubscribe(baseQueueName);
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
                    await instance.subscribe(baseQueueName, {
                        [messageObject.event]: async (consumedMessage, ack) => {
                            expect(consumedMessage).to.be.equal(messageObject);

                            await ack();
                            resolve();
                        }
                    }),
                        await instance.unsubscribe(baseQueueName);
                    await instance.resubscribe(baseQueueName);
                    await instance.publish(messageObject);
                });
            });

            it('should not reject when handler subscription exist', async () => {
                return new Promise(async (resolve) => {
                    await instance.subscribe(baseQueueName, {
                        [messageObject.event]: async (consumedMessage, ack) => {
                            expect(consumedMessage).to.be.equal(messageObject);

                            await ack();
                            resolve();
                        }
                    }),
                        await expect(instance.resubscribe(baseQueueName)).to.not.reject();
                    await instance.publish(messageObject);
                });
            });
        });
    });
});
