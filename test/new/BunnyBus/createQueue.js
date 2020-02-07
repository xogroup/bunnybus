'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        channelManager = instance.channels;
    });

    describe('public methods', () => {

        describe('createQueue', () => {

            const baseChannelName = 'bunnybus-createQueue';
            const baseQueueName = 'test-queue';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            after(async () => {

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            it(`should create a queue with name ${baseQueueName}`, async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result1 = null;

                    const result2 = await instance.createQueue(baseQueueName);

                    try {
                        await channelContext.channel.checkQueue(baseQueueName);
                    }
                    catch (err) {
                        result1 = err;
                    }

                    expect(result1).to.not.exist();
                    expect(result2).to.exist();
                    expect(result2.queue).to.equal(baseQueueName);
                    expect(result2.messageCount).to.equal(0);
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should not error when creating queue concurrently', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await Promise.all([
                        instance.createQueue(baseQueueName),
                        instance.createQueue(baseQueueName)
                    ]);

                    try {
                        await channelContext.channel.checkQueue(baseQueueName);
                    }
                    catch (err) {
                        result = err;
                    }

                    expect(result).to.not.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should not error when creating queue sequentially', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await instance.createQueue(baseQueueName),
                    await instance.createQueue(baseQueueName);

                    try {
                        await channelContext.channel.checkQueue(baseQueueName);
                    }
                    catch (err) {
                        result = err;
                    }

                    expect(result).to.not.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });
        });
    });
});
