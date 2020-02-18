'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;

describe('BunnyBus', () => {

    describe('events', () => {

        before(async () => {

            instance = new BunnyBus();
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionManager = instance.connections;
            channelManager = instance.channels;
        });

        describe('recovery', () => {

            const baseChannelName = 'bunnybus-events-recovery';
            const baseQueueName = 'test-events-recovery-queue';

            beforeEach(async () => {

                await instance._autoBuildChannelContext(baseChannelName);
            });

            it('should emit RECOVERING_CONNECTION_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERING_CONNECTION_EVENT, (connectionName) => {

                        expect(connectionName).to.equal(BunnyBus.DEFAULT_CONNECTION_NAME);
                        resolve();
                    });

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            it('should emit RECOVERING_CHANNEL_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERING_CHANNEL_EVENT, (channelName) => {

                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            it('should emit RECOVERING_CHANNEL_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERING_CHANNEL_EVENT, (channelName) => {

                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });

                    channelManager.close(baseChannelName);
                });
            });

            it('should emit RECOVERED_CONNECTION_EVENT when closed connection is recovered', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERED_CONNECTION_EVENT, (connectionName) => {

                        expect(connectionName).to.equal(BunnyBus.DEFAULT_CONNECTION_NAME);
                        resolve();
                    });

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });


            it('should emit RECOVERED_CHANNEL_EVENT when closed connection is recovered', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, (channelName) => {

                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });

                    connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
                });
            });

            it('should emit RECOVERED_CHANNEL_EVENT when closed connection is recovering', async () => {

                await new Promise((resolve) => {

                    instance.once(BunnyBus.RECOVERED_CHANNEL_EVENT, (channelName) => {

                        expect(channelName).to.equal(baseChannelName);
                        resolve();
                    });

                    channelManager.close(baseChannelName);
                });
            });
        });
    });
});
