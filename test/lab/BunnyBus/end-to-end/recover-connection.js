'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Wreck = require('@hapi/wreck');
const BunnyBus = require('../../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let mgmtApi = undefined;

describe('BunnyBus', () => {
    describe('end to end behaviors', () => {
        const baseChannelName = 'bunnybus-e2e-conn-recovery';
        const baseQueueName = 'test-e2e-auto-recovery-queue';
        const vhostName = 'bunnybus-e2e-conn-recovery';

        before(async () => {
            // Create an isolated vhost where this test's connections can be
            // monitored and terminated independently

            const { hostname, username, password } = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

            mgmtApi = Wreck.defaults({
                baseUrl: `http://${username}:${password}@${hostname}:15672/api/`
            });

            await mgmtApi.put(`vhosts/${vhostName}`, {});
        });

        beforeEach(async () => {
            instance = new BunnyBus();
            instance.config = {
                ...BunnyBus.DEFAULT_SERVER_CONFIGURATION,
                vhost: vhostName
            };
        });

        afterEach(async () => {
            const channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

            await Promise.all([
                channelContext.channel.deleteExchange(instance.config.globalExchange),
                channelContext.channel.deleteQueue(baseQueueName)
            ]);

            await instance.stop();
        });

        after(async () => {
            // Clean up temporary vhost
            await mgmtApi.delete(`vhosts/${vhostName}`);
        });

        describe('automatic recovery cases', () => {
            it('should correctly recover connection', { timeout: 20000 }, async () => {
                const handlers = {};
                const message = { event: 'test-event', hello: 'world2' };
                const consumePromise = new Promise(async (resolve) => {
                    handlers['test-event'] = async ({ message: sentMessage, ack }) => {
                        expect(sentMessage).to.contains(message);

                        await ack();

                        resolve();
                    };
                });

                // We use separate promises for success and failure because these
                // two events are independent. Add a timeout-based implicit success
                // case for the failure promise, since both success and failure
                // might be signalled and we want to take some precautions to avoid
                // missing a late failure.

                await instance.subscribe({ queue: baseQueueName, handlers });

                const successPromise = new Promise((resolve) => {
                    instance.on(BunnyBus.RECOVERED_CONNECTION_EVENT, () => resolve());
                });

                const failurePromise = new Promise((resolve, reject) => {
                    setTimeout(resolve, 4000);
                    instance.on(BunnyBus.RECOVERY_FAILED_EVENT, () => reject(new Error('Recovery failed')));
                });

                // Call the RabbitMQ HTTP management API to forcibly terminate our
                // connection. Poll for the connection, since it does not appear
                // immediately.

                let connList;

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const listResp = await mgmtApi.get(`vhosts/${vhostName}/connections`);
                    const listJson = listResp.payload.toString();

                    connList = JSON.parse(listJson);

                    if (connList.length >= 1) {
                        break;
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                expect(connList.length).to.equal(1);

                // The connections themselves are not namespaced by vhost
                await mgmtApi.delete(`connections/${connList[0].name}`);

                // Wait for both success and (potential) failure to settle

                await successPromise;
                await failurePromise;

                // Send a dummy message to make sure the connection was indeed
                // repaired successfully.

                await instance.publish({ message });
                await consumePromise;
            });
        });
    });
});
