'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../lib');

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
                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                await channelContext.channel.sendToQueue(baseQueueName, Buffer.from('foobar'));
                await channelContext.channel.waitForConfirms();
            });

            after(async () => {
                await channelContext.channel.deleteQueue(baseQueueName);
            });

            it(`should purge a queue with name ${baseQueueName}`, async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result1 = null;

                        const result2 = await instance.purgeQueue(baseQueueName);

                        try {
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result1 = err;
                        }

                        expect(result1).to.not.exist();
                        expect(result2).to.be.true();
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
                        let result1 = null;
                        let result2 = null;

                        try {
                            result2 = await instance.purgeQueue(baseQueueName);
                        } catch (err) {
                            result1 = err;
                        }

                        expect(result1).to.not.exist();
                        expect(result2).to.be.false();
                        // expect(result2.messageCount).to.equal(1);
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
