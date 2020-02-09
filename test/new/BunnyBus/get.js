'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('public methods', () => {

        describe('get', () => {

            const baseChannelName = 'bunnybus-send';
            const baseQueueName = 'test-send-queue';
            const message = { name : 'bunnybus' };
            const messageWithEvent = { event : 'event1', name : 'bunnybus' };

            beforeEach(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                await channelContext.channel.purgeQueue(baseQueueName);
            });

            after(async () => {

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            it('should receive message', async () => {

                const buffer = Buffer.from('hello world');
                const options = {
                    headers: {
                        foo: 'bar'
                    },
                    fields: {
                        fabri: 'kan'
                    },
                    expiration: (new Date()).getTime()
                };

                await Assertions.assertGet(instance, channelContext, buffer, baseQueueName, options);
            });
        });
    });
});
