'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { ManagementClient } = require('../../lib/clients');
const BunnyBus = require('../../lib');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let managementClient = undefined;
let bunnyBus = undefined;
let connectionManager = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('Clients', () => {
    const baseChannelName = 'managment-client';
    const baseQueueName = 'test-management-client-get-queue';

    before(async () => {
        bunnyBus = new BunnyBus();
        bunnyBus.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        connectionManager = bunnyBus.connections;
        channelManager = bunnyBus.channels;

        channelContext = await bunnyBus._autoBuildChannelContext(baseChannelName);
        await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
        await channelContext.channel.purgeQueue(baseQueueName);
        await channelContext.channel.sendToQueue(baseQueueName, Buffer.from('{ "hello":"world" }', 'utf8'));

        // It takes a bit for the management api interface to resolve a new queue.
        await new Promise((resolve) => setTimeout(resolve, 10000));
    });

    after(async () => {
        await channelContext.channel.deleteQueue(baseQueueName);
    });

    beforeEach(() => {
        managementClient = new ManagementClient('foobar', BunnyBus.DEFAULT_SERVER_CONFIGURATION);
    });

    describe('ManagementClient', () => {
        describe('constructor', () => {
            it('should return name when supplied', async () => {
                expect(managementClient).to.contain({
                    _name: 'foobar'
                });
            });

            it('should return supplied connection options', async () => {
                expect(managementClient).to.contain({
                    _connectionOptions: {
                        hostname: BunnyBus.DEFAULT_SERVER_CONFIGURATION.hostname,
                        username: BunnyBus.DEFAULT_SERVER_CONFIGURATION.username,
                        password: BunnyBus.DEFAULT_SERVER_CONFIGURATION.password,
                        vhost: BunnyBus.DEFAULT_SERVER_CONFIGURATION.vhost,
                        timeout: BunnyBus.DEFAULT_SERVER_CONFIGURATION.timeout * 6,
                        maxRetryCount: BunnyBus.DEFAULT_SERVER_CONFIGURATION.maxRetryCount
                    }
                });
            });

            it('should not be active', async () => {
                expect(managementClient).to.contain({
                    _active: false
                });
            });

            it('should not have protocolAndHost set', async () => {
                expect(managementClient._protocolAndHost).to.not.exist().and.to.be.undefined();
            });

            it('should have instantiated createdAt timestamp', async () => {
                expect(managementClient._createdAt).to.exist().and.to.be.a.number();
            });
        });

        describe('properties', () => {
            describe('name', () => {
                it('should return "foobar"', async () => {
                    expect(managementClient.name).to.equal('foobar');
                });
            });

            describe('uniqueName', () => {
                it('should return a namespaced name', async () => {
                    expect(managementClient.uniqueName).to.match(/management-client_foobar_\d*/);
                });
            });

            describe('connectionOptions', () => {
                it('should return an object', async () => {
                    expect(managementClient.connectionOptions).to.be.an.object();
                });
            });

            describe('active', () => {
                it('should return a boolean', async () => {
                    expect(managementClient.active).to.be.boolean();
                });
            });
        });

        describe('initialize', () => {
            it('should have initialized the protocol', async () => {
                await managementClient.initialize();

                expect(managementClient._protocolAndHost)
                    .to.exist()
                    .and.to.be.a.string()
                    .and.to.equal('http://127.0.0.1:15672');
            });

            it('should be an active instance when initialization is successful', async () => {
                await managementClient.initialize();

                expect(managementClient.active).to.be.true();
            });

            it('should remain inactive when initialization fails', async () => {
                managementClient = new ManagementClient('foobar', {
                    ...BunnyBus.DEFAULT_SERVER_CONFIGURATION,
                    ...{ username: 'badUserName' }
                });

                await managementClient.initialize();

                expect(managementClient.active).to.be.false();
            });
        });

        describe('getQueue', () => {
            it('should return payload when active', async () => {
                await managementClient.initialize();

                // await new Promise((resolve) => setTimeout(resolve, 5000));
                expect(await managementClient.getQueue(baseQueueName))
                    .to.exist()
                    .and.to.contain({ queue: baseQueueName, messageCount: 1, consumerCount: 0 });
            });

            it('should return undefined when inactive', async () => {
                expect(await managementClient.getQueue(baseQueueName))
                    .to.not.exist()
                    .and.to.be.undefined();
            });
        });
    });
});
