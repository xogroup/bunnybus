'use strict';

const BunnyBus = require('../../lib');

const { describe, beforeAll, beforeEach, afterAll, afterEach, it, expect } = require('@jest/globals');

let instance = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    beforeAll(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('Jest background task cleanup check', () => {
        const baseChannelName = 'bunnybus-jest';
        const baseQueueName = 'test-jest-queue';
        const baseErrorQueueName = `${baseQueueName}_error`;
        const messageObject = { event: 'a.b', name: 'bunnybus' };
        const messageString = 'bunnybus';

        beforeAll(async () => {
            channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

            await Promise.all([
                channelContext.channel.deleteExchange(instance.config.globalExchange),
                channelContext.channel.deleteQueue(baseQueueName),
                channelContext.channel.deleteQueue(baseErrorQueueName)
            ]);
        });

        afterAll(async () => {
            await Promise.all([
                channelContext.channel.deleteExchange(instance.config.globalExchange),
                channelContext.channel.deleteQueue(baseQueueName),
                channelContext.channel.deleteQueue(baseErrorQueueName)
            ]);

            await instance.stop();
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {
            return new Promise(async (resolve) => {
                const handlers = {};
                handlers[messageObject.event] = async ({ message: consumedMessage, ack }) => {
                    expect(consumedMessage).toEqual(messageObject);
                    await ack();
                    resolve();
                };

                await instance.subscribe({ queue: baseQueueName, handlers });
                await instance.publish({ message: messageObject });
            });
        });
    });
});
