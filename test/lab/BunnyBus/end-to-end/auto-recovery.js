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
        const baseChannelName = 'bunnybus-e2e-auto-recovery';
        const baseQueueName = 'test-e2e-auto-recovery-queue';

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
            await Promise.all([
                channelContext.channel.deleteExchange(instance.config.globalExchange),
                channelContext.channel.deleteQueue(baseQueueName)
            ]);

            await instance.stop();
        });

        describe('automatic recovery cases', () => {
            it('should correctly recover consumer', { timeout: 5000 }, async () => {
                const targetChannelName = BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName);
                const message = { event: 'test-event', hello: 'world' };
                const handlers = {};

                const consumePromise = new Promise(async (resolve) => {
                    handlers['test-event'] = async ({ message: sentMessage, ack }) => {
                        expect(sentMessage).to.contains(message);

                        await ack();

                        resolve();
                    };
                });

                const recoveryPromise = new Promise(async (resolve) => {
                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, (channelName) => {
                        const result = Object.keys(channelManager.get(targetChannelName).channel.consumers).length;

                        expect(channelName).to.equal(targetChannelName);
                        expect(result).to.be.at.least(1);

                        resolve();
                    });
                });

                const timeDelayPromise = new Promise((resolve) => {
                    setTimeout(resolve, 4000);
                });

                await instance.subscribe({ queue: baseQueueName, handlers });
                await channelManager.close(targetChannelName);
                await recoveryPromise;
                await instance.publish({ message });
                await consumePromise;
                await timeDelayPromise;
            });
        });
    });
});
