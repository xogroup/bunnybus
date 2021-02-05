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
        describe('deleteExchange', () => {
            const baseChannelName = 'bunnybus-deleteExchange';
            const baseExchangeName = 'test-exchange';

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.assertExchange(baseExchangeName, 'topic', BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION);
            });

            after(async () => {
                await channelContext.channel.deleteExchange(baseExchangeName);
                await instance.stop();
            });

            it(`should delete an exchange with name ${baseExchangeName}`, async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result1 = null;

                        const result2 = await instance.deleteExchange({ name: baseExchangeName });

                        try {
                            await channelContext.channel.checkExchange(baseExchangeName);
                        } catch (err) {
                            result1 = err;
                        }

                        expect(result1).to.exist();
                        expect(result2).to.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when deleting exchange concurrently', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await Promise.all([
                            instance.deleteExchange({ name: baseExchangeName }),
                            instance.deleteExchange({ name: baseExchangeName })
                        ]);

                        try {
                            await channelContext.channel.checkExchange(baseExchangeName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when deleting exchange sequentially', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await instance.deleteExchange({ name: baseExchangeName });
                        await instance.deleteExchange({ name: baseExchangeName });

                        try {
                            await channelContext.channel.checkExchange(baseExchangeName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when connection does not pre-exist', async () => {
                await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await instance.deleteExchange({ name: baseExchangeName });

                        try {
                            // removing the connection cancels all channels attached to it.
                            // so we have to reinstate the channel used for this test as well
                            await instance._autoBuildChannelContext({ channelName: baseChannelName });
                            await channelContext.channel.checkExchange(baseExchangeName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when channel does not pre-exist', async () => {
                await channelManager.close(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await instance.deleteExchange({ name: baseExchangeName });

                        try {
                            await channelContext.channel.checkExchange(baseExchangeName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
