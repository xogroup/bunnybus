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

        describe('checkQueue', () => {

            const baseChannelName = 'bunnybus-checkQueue';
            const baseQueueName = 'test-queue';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            after(async () => {

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            it('should be false when queue does not exist', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    const result1 = await instance.checkQueue(baseQueueName);
                    const result2 = instance.channels.get(BunnyBus.DEFAULT_MANAGEMENT_CHANNEL_NAME);

                    expect(result1).be.false();
                    expect(result2.channel).to.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should be true when queue does exist', async () => {

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);

                await Assertions.autoRecoverChannel(async () => {

                    const result = await instance.checkQueue(baseQueueName);

                    expect(result).be.true();
                },
                connectionContext,
                channelContext,
                channelManager);
            });
        });
    });
});
