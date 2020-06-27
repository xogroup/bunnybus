'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');
const { ChannelManager } = require('../../../lib/states');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    describe('events', () => {
        before(async () => {
            instance = new BunnyBus();
            // instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionManager = instance.connections;
            channelManager = instance.channels;
        });

        describe('recovery', () => {
            const baseChannelName = 'bunnybus-events-recovery';
            const baseQueueName = 'test-events-recovery-queue';

            beforeEach(async () => {
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
            });

            after(async () => {
                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                await channelContext.channel.deleteQueue(baseQueueName);

                await instance.stop();
            });

            it('should emit RECOVERING_CONNECTION_EVENT when closed connection is recovering', async () => {
                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERING_CONNECTION_EVENT, (connectionName) => {
                        expect(connectionName).to.equal(BunnyBus.DEFAULT_CONNECTION_NAME);
                        resolve();
                    });
                });

                await Promise.all([connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME), promise]);
            });

            it('should emit RECOVERING_CHANNEL_EVENT when closed connection is recovering', async () => {
                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERING_CHANNEL_EVENT, (channelName) => {
                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });
                });

                await Promise.all([connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME), promise]);
            });

            it('should emit RECOVERING_CHANNEL_EVENT when closed connection is recovering', async () => {
                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERING_CHANNEL_EVENT, (channelName) => {
                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });
                });

                await Promise.all([channelManager.close(baseChannelName), promise]);
            });

            it('should emit RECOVERED_CONNECTION_EVENT when closed connection is recovered', async () => {
                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERED_CONNECTION_EVENT, (connectionName) => {
                        expect(connectionName).to.equal(BunnyBus.DEFAULT_CONNECTION_NAME);
                        resolve();
                    });
                });

                await Promise.all([connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME), promise]);
            });

            it('should emit RECOVERED_CHANNEL_EVENT when closed connection is recovered', async () => {
                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, (channelName) => {
                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });
                });

                await Promise.all([connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME), promise]);
            });

            it('should emit RECOVERED_CHANNEL_EVENT when closed connection is recovering', async () => {
                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, (channelName) => {
                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });
                });

                await Promise.all([channelManager.close(baseChannelName), promise]);
            });

            it('should emit RECOVERY_FAILED_EVENT when recovery process fails', { timeout: 6000 }, async () => {
                // Setup a subscripton so recovery is necessary.
                await instance.subscribe(baseQueueName, {
                    'subscribed-event': () => {}
                });

                // Make sure connection/channel state is in a good place.
                expect(connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME).connection).to.exist();
                expect(channelManager.get(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName)).channel).to.exist();

                // Inject a poison configuration value.
                instance.config = Object.assign({}, BunnyBus.DEFAULT_SERVER_CONFIGURATION, {
                    hostname: 'fake',
                    timeout: 300,
                    connectionRetryCount: 1
                });
                connectionManager.get(BunnyBus.DEFAULT_CONNECTION_NAME)._connectionOptions = Object.assign(
                    {},
                    BunnyBus.DEFAULT_SERVER_CONFIGURATION,
                    { hostname: 'fake', timeout: 300, connectionRetryCount: 1 }
                );
                // Highjack the recovery state because previous test might have left this in a bad place
                instance._state.recoveryLock = false;

                // Should reach this since we exceed retry attemps
                const errorPromise = new Promise((resolve) => {
                    instance.once(BunnyBus.RECOVERY_FAILED_EVENT, (err) => {
                        expect(err).to.be.an.error('Exceeded maximum attempts of retries of 1');
                        resolve();
                    });
                });

                // Initiate test
                await Promise.all([connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME), errorPromise]);

                // Everything below here is just clean up.
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

                instance.subscriptions.remove(baseQueueName);

                const cleanupPromise = new Promise(async (resolve) => {
                    channelManager.once(ChannelManager.CHANNEL_REMOVED, resolve);
                });

                await Promise.all([
                    connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME),
                    channelManager.remove(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName)),
                    cleanupPromise
                ]);
            });
        });
    });
});
