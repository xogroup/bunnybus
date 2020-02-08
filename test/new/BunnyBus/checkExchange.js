'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        channelManager = instance.channels;
    });

    describe('public methods', () => {

        describe('checkExchange', () => {

            const baseChannelName = 'bunnybus-checkExchange';
            const baseExchangeName = 'test-exchange';

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.deleteExchange(baseExchangeName);
            });

            after(async () => {

                await channelContext.channel.deleteExchange(baseExchangeName);
            });

            it('should be false when exchange does not exist', async () => {

                await Assertions.autoRecoverChannel(async () => {

                    const result1 = await instance.checkExchange(baseExchangeName);
                    const result2 = instance.channels.get(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                    expect(result1).be.false();
                    expect(result2.channel).to.exist();
                },
                connectionContext,
                channelContext,
                channelManager);
            });

            it('should be true when exchange does exist', async () => {

                await channelContext.channel.assertExchange(baseExchangeName, 'topic', BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION);

                await Assertions.autoRecoverChannel(async () => {

                    const result = await instance.checkExchange(baseExchangeName);

                    expect(result).be.true();
                },
                connectionContext,
                channelContext,
                channelManager);
            });
        });
    });
});
