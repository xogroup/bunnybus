'use strict';

const {
    before,
    after,
    afterEach,
    describe,
    it
} = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../lib');

let instance;

describe('integration load test', () => {
    const publishTarget = 1000;

    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('with ES6 native promises interface', () => {
        const queueName = 'load-promise-queue-1';
        const errorQueueName = `${queueName}_error`;
        const message = { event: 'a.promise', name: 'bunnybus' };
        const patterns = ['a.promise'];

        before(() => {
            return instance
                ._autoConnectChannel()
                .then(
                    instance.createExchange.bind(
                        instance,
                        instance.config.globalExchange,
                        'topic',
                        null
                    )
                )
                .then(instance.createQueue.bind(instance, queueName))
                .then(() => {
                    const promises = patterns.map((pattern) => {
                        return instance.channel.bindQueue(
                            queueName,
                            instance.config.globalExchange,
                            pattern
                        );
                    });

                    return Promise.all(promises);
                });
        });

        afterEach(() => {
            return instance
                ._autoConnectChannel()
                .then(instance.unsubscribe.bind(instance, queueName));
        });

        after(() => {
            return instance
                ._autoConnectChannel()
                .then(
                    instance.deleteExchange.bind(
                        instance,
                        instance.config.globalExchange,
                        null
                    )
                )
                .then(instance.deleteQueue.bind(instance, queueName))
                .then(instance.deleteQueue.bind(instance, errorQueueName));
        });

        it('should publish all messages within 2 seconds', () => {
            const promises = new Array(publishTarget);
            promises.fill('');

            return Promise.all(promises.map(() => instance.publish(message)));
        });

        it('should consume all messages within 2 seconds', async () => {
            await new Promise(async (resolve) => {
                let count = 0;
                await instance.subscribe(queueName, {
                    'a.promise': (msg, ack) => {
                        return ack().then(() => {
                            if (++count === publishTarget) {
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    });
});
