'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');
const { ChannelManager, ConnectionManager } = require('../../../lib/states');
const Exceptions = require('../../../lib/exceptions');

const { describe, beforeEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('state management', () => {

    describe('Channel Manager', () => {

        let instance = undefined;
        let connectionContext = undefined;
        let defaultConfiguration = undefined;

        beforeEach(async () => {

            defaultConfiguration = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionContext = await (new ConnectionManager()).create('channel-baseConnection', defaultConfiguration);
            instance = new ChannelManager();
        });

        describe('create', () => {

            const baseChannelName = 'channel-createChannel';

            it('should create a channel with default values', async () => {

                await instance.create(baseChannelName, connectionContext, defaultConfiguration);

                const result = instance._channels.get(baseChannelName);

                expect(result).to.exist();
                expect(result).to.be.an.object();
                expect(result.channelOptions).to.exist();
                expect(result.channelOptions).to.contain(defaultConfiguration);
                expect(result.channel).to.exist();
                expect(result.channel).to.be.an.object();
            });

            it('should return same channel when request are called concurrently', async () => {

                const [result1, result2] = await Promise.all([
                    instance.create(baseChannelName, connectionContext, defaultConfiguration),
                    instance.create(baseChannelName, connectionContext, defaultConfiguration)
                ]);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
            });

            it('should return same connection when request are called sequentially', async () => {

                const result1 = await instance.create(baseChannelName, connectionContext, defaultConfiguration);
                const result2 = await instance.create(baseChannelName, connectionContext, defaultConfiguration);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
                expect(result1.channel).to.shallow.equal(result2.channel);
            });

            it('should error when no connectionContext is supplied', async () => {

                let sut = null;

                try {
                    await instance.create(baseChannelName);
                }
                catch (err) {
                    sut = err;
                }

                expect(sut).to.exist();
                expect(sut).to.be.an.error(Exceptions.NoConnectionError);
            });

            it('should error when connectionContext supplied does not have a connection', async () => {

                connectionContext.connection = undefined;

                let sut = null;

                try {
                    await instance.create(baseChannelName, connectionContext);
                }
                catch (err) {
                    sut = err;
                }

                expect(sut).to.exist();
                expect(sut).to.be.an.error(Exceptions.NoConnectionError);
            });

            it('should error when no channel options is supplied', async () => {

                let sut = null;

                try {
                    await instance.create(baseChannelName, connectionContext);
                }
                catch (err) {
                    sut = err;
                }

                expect(sut).to.exist();
                expect(sut).to.be.an.error('Expected channelOptions to be supplied');
            });

            it('should error when a confirming channel call fails', { timeout: 10000 }, async () => {

                connectionContext.connection.createConfirmChannel = async () => {

                    throw new Error('Mock error');
                };

                let sut = null;

                try {
                    await instance.create(baseChannelName, connectionContext, { prefetch: 1, connectionRetryCount: 1, timeout: 100 });
                }
                catch (err) {
                    sut = err;
                }

                expect(sut).to.exist();
                expect(sut).to.be.an.error('Exceeded maximum attempts of retries');
            });
        });

        describe('contains', () => {

            const baseChannelName = 'channel-containsChannel';

            it('should return true when channel context exist', async () => {

                await instance.create(baseChannelName, connectionContext, defaultConfiguration);

                const result = instance.contains(baseChannelName);

                expect(result).to.be.true();
            });

            it('should return false when connection context does not exist', async () => {

                const result = instance.contains(baseChannelName);

                expect(result).to.be.false();
            });
        });

        describe('get', () => {

            const baseChannelName = 'channel-getChannel';

            it('should return a connection context when it exist', async () => {

                const channelContext = await instance.create(baseChannelName, connectionContext, defaultConfiguration);

                const result = instance.get(baseChannelName);

                expect(result).to.exist();
                expect(result.name).to.equal(baseChannelName);
                expect(result.channelOptions).to.contains(defaultConfiguration);
                expect(result.channel).to.shallow.equal(channelContext.channel);
            });

            it('should be undefined when the connection context does not exist', async () => {

                const result = instance.get(baseChannelName);

                expect(result).to.not.exist();
                expect(result).to.be.undefined();
            });
        });

        describe('getChannel', () => {

            const baseChannelName = 'channel-getChannelChannel';

            it('should return a channel when it exist', async () => {

                const channelContext = await instance.create(baseChannelName, connectionContext, defaultConfiguration);

                const result = instance.getChannel(baseChannelName);

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext.channel);
            });

            it('should be undefined when the channel does not exist', async () => {

                const result = instance.get(baseChannelName);

                expect(result).to.not.exist();
                expect(result).to.be.undefined();
            });
        });

        describe('close', () => {

            const baseChannelName = 'channel-closeChannel';

            it('should close channel when it exist', async () => {

                await instance.create(baseChannelName, connectionContext, defaultConfiguration);

                await instance.close(baseChannelName);

                const result = instance._channels.get(baseChannelName);

                expect(result).to.exist();
                expect(result.name).to.equal(baseChannelName);
                expect(result.channel).to.not.exist();
                expect(result.channel).to.be.undefined();
            });
        });
    });
});
