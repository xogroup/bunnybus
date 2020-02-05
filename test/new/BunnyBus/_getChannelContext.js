'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Events = require('../../../lib/events');
const BunnyBus = require('../../../lib');
const { ChannelManager, ConnectionManager } = require('../../../lib/states');
const Exceptions = require('../../../lib/exceptions');

const { describe, before, beforeEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;

describe('BunnyBus', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        connectionManager = instance.connections;
        channelManager = instance.channels;
    });

    describe('private methods', () => {

        describe('_getChannelContext', () => {

            const baseChannelName = 'bunnybus-_getChannelContext';

            beforeEach(async () => {

                if (connectionManager.hasConnection(BunnyBus.DEFAULT_CONNECTION_NAME)) {

                    const promise = new Promise((resolve) => {

                        channelManager.on(Events.CHANNEL_MANAGER_REMOVED, resolve);
                    });
    
                    await connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME);
                    await promise;
                }
            });

            it('should establish a new connection and channel when none exist', async () => {

                const result = await instance._getChannelContext(baseChannelName);

                expect(result).to.exist();
                expect(result.channel).to.exist();
                expect(result.connectionContext).to.exist();
                expect(result.connectionContext.connection).to.exist();
            });

            it('should establish a new channel when none exist', async () => {

                const connectionContext = await connectionManager.create(BunnyBus.DEFAULT_CONNECTION_NAME, BunnyBus.DEFAULT_SERVER_CONFIGURATION);

                const result = await instance._getChannelContext(baseChannelName);

                expect(result).to.exist();
                expect(result.channel).to.exist();
                expect(result.connectionContext).to.exist();
                expect(result.connectionContext.connection).to.exist();
                expect(result.connectionContext).to.shallow.equal(connectionContext);
            });

            it('should return the same channel context when called concurrently', async () => {

                const [result1, result2] = await Promise.all([
                    instance._getChannelContext(baseChannelName),
                    instance._getChannelContext(baseChannelName)
                ]);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
            });

            it('should return the same channel context when called sequentially', async () => {

                const result1 = await instance._getChannelContext(baseChannelName);
                const result2 = await instance._getChannelContext(baseChannelName);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
            });
        });
    });
});
