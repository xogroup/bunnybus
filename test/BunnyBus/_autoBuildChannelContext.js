'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { ChannelManager } = require('../../lib/states');
const Helpers = require('../../lib/helpers');
const BunnyBus = require('../../lib');
const { assertConvertToBuffer } = require('../assertions');

const { describe, after, before, beforeEach, it } = (exports.lab = Lab.script());
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

    after(async () => {
        await instance.stop();
    });

    describe('private methods', () => {
        describe('_autoBuildChannelContext', () => {
            const baseChannelName = 'bunnybus-_autoBuildChannelContext';

            describe('when neither connection nor channel context exist', () => {
                beforeEach(async () => {
                    if (connectionManager.hasConnection(BunnyBus.DEFAULT_CONNECTION_NAME)) {
                        const promise = new Promise((resolve) => {
                            channelManager.on(ChannelManager.CHANNEL_REMOVED, resolve);
                        });

                        await connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME);
                        await Helpers.timeoutAsync(async () => {
                            await promise;
                        }, 50);
                    }

                    expect(connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME)).to.be.undefined();
                    expect(channelManager.get(baseChannelName)).to.be.undefined();
                });

                it('should establish a new connection and channel when none exist', async () => {
                    const result = await instance._autoBuildChannelContext(baseChannelName);

                    expect(result).to.exist();
                    expect(result.channel).to.exist();
                    expect(result.connectionContext).to.exist();
                    expect(result.connectionContext.connection).to.exist();
                });

                it('should return the same channel context when called concurrently', async () => {
                    const [result1, result2] = await Promise.all([
                        instance._autoBuildChannelContext(baseChannelName),
                        instance._autoBuildChannelContext(baseChannelName)
                    ]);

                    expect(result1).to.exist();
                    expect(result2).to.exist();
                    expect(result1).to.shallow.equal(result2);
                });

                it('should return the same channel context when called sequentially', async () => {
                    const result1 = await instance._autoBuildChannelContext(baseChannelName);
                    const result2 = await instance._autoBuildChannelContext(baseChannelName);

                    expect(result1).to.exist();
                    expect(result2).to.exist();
                    expect(result1).to.shallow.equal(result2);
                });
            });

            describe('when connection context exist', () => {
                beforeEach(async () => {
                    if (connectionManager.hasConnection(BunnyBus.DEFAULT_CONNECTION_NAME)) {
                        const promise = new Promise((resolve) => {
                            channelManager.on(ChannelManager.CHANNEL_REMOVED, resolve);
                        });

                        await connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME);
                        await Helpers.timeoutAsync(async () => {
                            await promise;
                        }, 50);
                    }

                    expect(connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME)).to.be.undefined();

                    connectionContext = await connectionManager.create(
                        BunnyBus.DEFAULT_CONNECTION_NAME,
                        BunnyBus.DEFAULT_SERVER_CONFIGURATION
                    );

                    expect(connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME)).to.exist();
                    expect(channelManager.get(baseChannelName)).to.be.undefined();
                });

                it('should establish a new channel context when none exist', async () => {
                    const result = await instance._autoBuildChannelContext(baseChannelName);

                    expect(result).to.exist();
                    expect(result.channel).to.exist();
                    expect(result.connectionContext).to.exist();
                    expect(result.connectionContext.connection).to.exist();
                    expect(result.connectionContext).to.shallow.equal(connectionContext);
                });

                it('should establish a new channel context when connection is closed', async () => {
                    await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                    const result = await instance._autoBuildChannelContext(baseChannelName);

                    expect(result).to.exist();
                    expect(result.channel).to.exist();
                    expect(result.connectionContext).to.exist();
                    expect(result.connectionContext.connection).to.exist();
                    expect(result.connectionContext).to.shallow.equal(connectionContext);
                });
            });

            describe('when both connection and channel context exist', () => {
                beforeEach(async () => {
                    if (connectionManager.hasConnection(BunnyBus.DEFAULT_CONNECTION_NAME)) {
                        const promise = new Promise((resolve) => {
                            channelManager.on(ChannelManager.CHANNEL_REMOVED, resolve);
                        });

                        await connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME);
                        await Helpers.timeoutAsync(async () => {
                            await promise;
                        }, 50);
                    }

                    expect(connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME)).to.be.undefined();
                    expect(channelManager.get(baseChannelName)).to.be.undefined();

                    connectionContext = await connectionManager.create(
                        BunnyBus.DEFAULT_CONNECTION_NAME,
                        BunnyBus.DEFAULT_SERVER_CONFIGURATION
                    );
                    channelContext = await channelManager.create(
                        baseChannelName,
                        null,
                        connectionContext,
                        BunnyBus.DEFAULT_SERVER_CONFIGURATION
                    );

                    expect(connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME)).to.exist();
                    expect(channelManager.get(baseChannelName)).to.exist();
                });

                it('should establish a channel when the underlying connection is closed', async () => {
                    const promise = new Promise((resolve) => {
                        channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
                    });

                    await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                    await promise;

                    expect(connectionContext.connection).to.be.undefined();
                    expect(channelContext.channel).to.be.undefined();

                    const result = await instance._autoBuildChannelContext(baseChannelName);

                    expect(result).to.exist();
                    expect(result.channel).to.exist();
                    expect(result.connectionContext).to.exist();
                    expect(result.connectionContext.connection).to.exist();
                    expect(result.connectionContext).to.shallow.equal(connectionContext);
                });

                it('should establish a channl when the channel is closed', async () => {
                    await channelManager.close(baseChannelName);

                    expect(connectionContext.connection).to.exist();
                    expect(channelContext.channel).to.be.undefined();

                    const result = await instance._autoBuildChannelContext(baseChannelName);

                    expect(result).to.exist();
                    expect(result.channel).to.exist();
                    expect(result.connectionContext).to.exist();
                    expect(result.connectionContext.connection).to.exist();
                    expect(result.connectionContext).to.shallow.equal(connectionContext);
                });
            });
        });
    });
});
