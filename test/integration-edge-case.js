'use strict';

const { expect } = require('@hapi/code');

const {
    before,
    beforeEach,
    describe,
    it
} = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../lib');

let instance;

describe('positive integration tests ', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('edge cases', async () => {
        beforeEach(async () => {
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            await instance._closeConnection();
        });

        it('should pass when parallel calls to publish happens when connection starts off closed', async () => {
            const message = { event: 'ee', name: 'bunnybus' };

            await Promise.all(
                [1, 2, 3].map(
                    async () => await instance.publish.bind(instance, message)()
                )
            );
        });

        it('should pass when send pushes a message to a subscribed queue', async () => {
            await new Promise(async (resolve) => {
                const message = { event: 'ea', name: 'bunnybus' };
                const queueName = 'edge-case-get-to-subscribe';
                let counter = 0;

                const done = () => {
                    if (++counter === 2) {
                        resolve();
                    }
                };

                const handlers = {
                    ea: async (subscribedMessaged, ack) => {
                        expect(subscribedMessaged).to.be.equal(message);
                        await ack();
                        done();
                    }
                };

                await instance._autoConnectChannel();
                await instance.createQueue(queueName);

                await instance.send(message, queueName);
                await instance.subscribe(queueName, handlers);
                await instance.deleteQueue(queueName);
                done();
            });
        });

        it('should pass when server host configuration value is not valid', async () => {
            const message = { event: 'eb', name: 'bunnybus' };
            instance.config = { server: 'fake' };

            try {
                await instance.publish(message);

                throw new Error('fake configuration took');
            }
            catch (error) {
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

                await instance.publish(message);
            }
        });
    });
});
