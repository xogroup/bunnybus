'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('public methods', () => {
        describe('stop', () => {
            const baseChannelName = 'bunnybus-stop';
            const baseQueueName1 = 'test-stop-queue1';
            const baseQueueName2 = 'test-stop-queue2';

            after(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([channelContext.channel.deleteQueue(baseQueueName1), channelContext.channel.deleteQueue(baseQueueName2)]);

                await instance.stop();
            });

            it('should destroy all connections, channels and subscriptions', async () => {
                await instance.subscribe({ queue: baseQueueName1, handlers: { a: (...args) => {} } });
                await instance.subscribe({ queue: baseQueueName2, handlers: { b: (...args) => {} } });

                expect(instance.connections.list()).to.be.length(1);
                expect(instance.channels.list()).to.be.length(3);
                expect(instance.subscriptions.list()).to.be.length(2);

                await instance.stop();

                expect(instance.connections.list()).to.be.length(0);
                expect(instance.channels.list()).to.be.length(0);
                expect(instance.subscriptions.list()).to.be.length(0);
            });
        });
    });
});
