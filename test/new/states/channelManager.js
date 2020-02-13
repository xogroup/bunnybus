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
        let connectionManager = undefined;
        let connectionContext = undefined;
        let defaultConfiguration = undefined;
        const baseConnectionName = 'channel-baseConnection';

        beforeEach(async () => {

            defaultConfiguration = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionManager = new ConnectionManager();
            connectionContext = await connectionManager.create(baseConnectionName, defaultConfiguration);
            instance = new ChannelManager();
        });

        describe('create', () => {

            const baseChannelName = 'channel-createChannel';

            it('should create a channel with default values', async () => {

                await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

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
                    instance.create(baseChannelName, null, connectionContext, defaultConfiguration),
                    instance.create(baseChannelName, null, connectionContext, defaultConfiguration)
                ]);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
            });

            it('should return same connection when request are called sequentially', async () => {

                const result1 = await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);
                const result2 = await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

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
                    await instance.create(baseChannelName, null, connectionContext);
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
                    await instance.create(baseChannelName, null, connectionContext);
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
                    await instance.create(baseChannelName, null, connectionContext, { prefetch: 1, connectionRetryCount: 1, timeout: 100 });
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

                await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

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

                const channelContext = await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

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

        describe('list', () => {

            const baseChannelName = 'channel-listChannel';

            it('should return 3 records when 3 were added', async () => {

                for (let i = 1; i <= 3; ++i) {
                    const channelName = `${baseChannelName}-${i}`;

                    await instance.create(channelName, null, connectionContext, defaultConfiguration);
                }

                const results = instance.list();

                expect(results).to.have.length(3);
            });
        });

        describe('hasChannel', () => {

            const baseChannelName = 'channel-hasChannelChannel';

            it('should be true when channel exist', async () => {

                await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

                const result = instance.hasChannel(baseChannelName);

                expect(result).to.be.true();
            });

            it('should be false when channel does not exist', async () => {

                const result = instance.hasChannel(baseChannelName);

                expect(result).to.be.false();
            });
        });

        describe('getChannel', () => {

            const baseChannelName = 'channel-getChannelChannel';

            it('should return a channel when it exist', async () => {

                const channelContext = await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

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

                await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

                await instance.close(baseChannelName);

                const result = instance._channels.get(baseChannelName);

                expect(result).to.exist();
                expect(result.name).to.equal(baseChannelName);
                expect(result.channel).to.not.exist();
                expect(result.channel).to.be.undefined();
            });

            it('should no-op when channel does not exist', async () => {

                await instance.remove(baseChannelName);
            });
        });

        describe('remove', () => {

            const baseChannelName = 'channel-removeChannel';

            it('should remove channel when it exist', async () => {

                await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);

                await instance.remove(baseChannelName);

                const result = instance._channels.get(baseChannelName);

                expect(result).to.not.exist();
                expect(result).to.be.undefined();
            });

            it('should no-op when channel does not exist', async () => {

                await instance.remove(baseChannelName);
            });
        });

        describe('Events', () => {

            const baseChannelName = 'channel-events';
            let channelContext = undefined;

            beforeEach(async () => {

                channelContext = await instance.create(baseChannelName, null, connectionContext, defaultConfiguration);
            });

            it('should emit AMQP_CHANNEL_CLOSE_EVENT when channel closes', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, (context) => {

                        result = context;
                        resolve();
                    });
                });

                channelContext.channel.emit('close');

                await promise;

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext);
            });

            it('should emit AMQP_CHANNEL_CLOSE_EVENT when underlying connection closes', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, (context) => {

                        result = context;
                        resolve();
                    });
                });

                await channelContext.connectionContext.connection.close();

                await promise;

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext);
            });

            it('should unset channel when channel closes', async () => {

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, resolve);
                });

                channelContext.channel.emit('close');

                await promise;

                const result = channelContext.channel;

                expect(result).to.not.exist();
                expect(result).to.be.undefined();
            });

            it('should emit AMQP_CHANNEL_ERROR_EVENT when channel errors', async () => {

                let result1 = null;
                let result2 = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_ERROR_EVENT, (err, context) => {

                        result1 = err;
                        result2 = context;
                        resolve();
                    });
                });

                channelContext.channel.emit('error', new Error('test'));

                await promise;

                expect(result1).to.exist();
                expect(result1).to.be.an.error('test');
                expect(result2).to.exist();
                expect(result2).to.shallow.equal(channelContext);
            });

            it('should emit AMQP_CHANNEL_RETURN_EVENT when channel errors', async () => {

                const payloadObject = {
                    content: Buffer.from('hello'),
                    fields: {},
                    properties: {}
                };

                let result1 = null;
                let result2 = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_RETURN_EVENT, (context, payload) => {

                        result1 = context;
                        result2 = payload;
                        resolve();
                    });
                });

                channelContext.channel.emit('return', payloadObject);

                await promise;

                expect(result1).to.exist();
                expect(result1).to.shallow.equal(channelContext);
                expect(result2).to.exist();
                expect(result2).to.contain(payloadObject);
            });

            it('should emit AMQP_CHANNEL_DRAIN_EVENT when channel drains', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_DRAIN_EVENT, (context) => {

                        result = context;
                        resolve();
                    });
                });

                channelContext.channel.emit('drain');

                await promise;

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext);
            });

            it('should emit CHANNEL_REMOVED from the context when channel is removed', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.CHANNEL_REMOVED, (context) => {

                        result = context;
                        resolve();
                    });
                });

                await instance.remove(baseChannelName);

                await promise;

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext);
            });

            it('should emit CHANNEL_REMOVED from the manager when channel is removed', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    instance.once(ChannelManager.CHANNEL_REMOVED, (context) => {

                        result = context;
                        resolve();
                    });
                });

                await instance.remove(baseChannelName);

                await promise;

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext);
            });

            it('should emit AMQP_CHANNEL_CLOSE_EVENT when connection is removed', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, (context) => {

                        result = context;
                        resolve();
                    });
                });

                await instance.remove(baseChannelName);

                await promise;

                expect(result).to.exist();
                expect(result).to.shallow.equal(channelContext);
            });

            it('should remove channel when underlying connection is removed', async () => {

                let result1 = null;

                expect(instance.get(baseChannelName)).to.exist();

                const promise = new Promise((resolve) => {

                    channelContext.once(ChannelManager.CHANNEL_REMOVED, (context) => {

                        result1 = context;

                        resolve();
                    });
                });

                await connectionManager.remove(baseConnectionName);

                await promise;

                const result2 = instance.get(baseChannelName);

                expect(result1).to.exist();
                expect(result1).to.shallow.equal(channelContext);
                expect(result2).to.not.exist();
                expect(result2).to.be.undefined();
            });
        });
    });
});
