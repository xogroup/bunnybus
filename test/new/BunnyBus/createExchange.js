'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Events = require('../../../lib/events');
const Helpers = require('../../../lib/helpers');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, it } = exports.lab = Lab.script();
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

        describe('createExchange', () => {

            const baseChannelName = 'bunnybus-createExchange';
            const baseExchangeName = 'test-exchange';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.deleteExchange(baseExchangeName);
            });

            it(`should create an exchange with name ${baseExchangeName}`, async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await instance.createExchange(baseExchangeName, 'topic');

                    try {
                        await channelContext.channel.checkExchange(baseExchangeName);
                    } 
                    catch (err) {
                        reuslt = err;
                    }

                    expect(result).to.not.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should not error when creating exchange concurrently', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await Promise.all([
                        instance.createExchange(baseExchangeName, 'topic'),
                        instance.createExchange(baseExchangeName, 'topic')
                    ]);

                    try {
                        await channelContext.channel.checkExchange(baseExchangeName);
                    } 
                    catch (err) {
                        reuslt = err;
                    }

                    expect(result).to.not.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should not error when creating exchange sequentially', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    let result = null;

                    await instance.createExchange(baseExchangeName, 'topic'),
                    await instance.createExchange(baseExchangeName, 'topic')

                    try {
                        await channelContext.channel.checkExchange(baseExchangeName);
                    } 
                    catch (err) {
                        reuslt = err;
                    }

                    expect(result).to.not.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });
        });
    });
});
