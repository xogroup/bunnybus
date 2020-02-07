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

        describe('deleteQueue', () => {

            const baseChannelName = 'bunnybus-deleteQueue';
            const baseQueueName = 'test-queue';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
            });

            after(async () => {

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            it(`should delete an queue with name ${baseQueueName}`, async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result1 = null;

                    const result2 = await instance.deleteQueue(baseQueueName);

                    try {
                        await channelContext.channel.checkQueue(baseQueueName);
                    }
                    catch (err) {
                        result1 = err;
                    }

                    expect(result1).to.exist();
                    expect(result2).to.exist();
                    expect(result2.messageCount).to.equal(0);
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should not error when deleting queue concurrently', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await Promise.all([
                        instance.deleteQueue(baseQueueName),
                        instance.deleteQueue(baseQueueName)
                    ]);

                    try {
                        await channelContext.channel.checkQueue(baseQueueName);
                    }
                    catch (err) {
                        result = err;
                    }

                    expect(result).to.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should not error when deleting queue sequentially', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await instance.deleteQueue(baseQueueName),
                    await instance.deleteQueue(baseQueueName);

                    try {
                        await channelContext.channel.checkQueue(baseQueueName);
                    }
                    catch (err) {
                        result = err;
                    }

                    expect(result).to.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });
        });
    });
});
