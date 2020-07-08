'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        connectionManager = instance.connections;
        channelManager = instance.channels;
    });

    describe('public methods', () => {
        describe('purgeQueue', () => {
            const baseChannelName = 'bunnybus-purgeeQueue';
            const baseQueueName = 'test-queue';

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                await channelContext.channel.sendToQueue(baseQueueName, Buffer.from('foobar'));
                await channelContext.channel.waitForConfirms();
            });

            after(async () => {
                await channelContext.channel.deleteQueue(baseQueueName);

                await instance.stop();
            });

            it(`should purge a queue with name ${baseQueueName}`, async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        expect(await instance.purgeQueue({ name: baseQueueName })).to.be.true();
                        await expect(channelContext.channel.checkQueue(baseQueueName)).to.not.reject();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when queue does not exist', async () => {
                await channelContext.channel.deleteQueue(baseQueueName);

                await Assertions.autoRecoverChannel(
                    async () => {
                        expect(await instance.purgeQueue({ name: baseQueueName })).to.be.false();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
