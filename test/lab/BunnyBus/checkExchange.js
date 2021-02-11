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
        describe('checkExchange', () => {
            const baseChannelName = 'bunnybus-checkExchange';
            const baseExchangeName = 'test-exchange';

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.deleteExchange(baseExchangeName);
            });

            after(async () => {
                await channelContext.channel.deleteExchange(baseExchangeName);
                await instance.stop();
            });

            it('should be undefined when exchange does not exist', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        const result1 = await instance.checkExchange({ name: baseExchangeName });
                        const result2 = instance.channels.get(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                        expect(result1).to.be.undefined();
                        expect(result2.channel).to.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should return exchange info when exchange does exist', async () => {
                await channelContext.channel.assertExchange(baseExchangeName, 'topic', BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION);

                await Assertions.autoRecoverChannel(
                    async () => {
                        const result = await instance.checkExchange({ name: baseExchangeName });

                        expect(result).to.exist().and.to.be.an.object();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when connection does not pre-exist', async () => {
                await channelContext.channel.assertExchange(baseExchangeName, 'topic', BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION);
                await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await Assertions.autoRecoverChannel(
                    async () => {
                        await expect(instance.checkExchange({ name: baseExchangeName })).to.not.reject();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when channel does not pre-exist', async () => {
                await channelContext.channel.assertExchange(baseExchangeName, 'topic', BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION);
                await channelManager.close(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                await Assertions.autoRecoverChannel(
                    async () => {
                        await expect(instance.checkExchange({ name: baseExchangeName })).to.not.reject();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
