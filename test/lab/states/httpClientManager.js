'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Sinon = require('sinon');
const BunnyBus = require('../../../lib');
const { HttpClientManager } = require('../../../lib/states');
const { ManagementClient } = require('../../../lib/clients');

const { describe, before, beforeEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let defaultConfiguration = undefined;

describe('state management', () => {
    describe('HttpClientManager', () => {
        beforeEach(() => {
            instance = new HttpClientManager();
            defaultConfiguration = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        });

        describe('create', () => {
            const baseClientName = 'httpClientManager-createClient';

            it('should create a conneciton with default values', async () => {
                const sut = await instance.create(baseClientName, defaultConfiguration);

                expect(sut).to.exist();
                expect(sut.active).to.be.true();
            });

            it('should return undefined when connection values are bad', async () => {
                const sut = await instance.create(baseClientName, {
                    ...defaultConfiguration,
                    ...{ username: 'badUserName' }
                });

                expect(sut).to.not.exist().and.to.be.undefined();
            });

            it('should return undefined for a previously attempted connection', async () => {
                instance._clients.set(
                    baseClientName,
                    new ManagementClient(baseClientName, { ...defaultConfiguration, ...{ username: 'badUserName' } })
                );

                const sut = await instance.create(baseClientName, defaultConfiguration);

                expect(sut).to.not.exist().and.to.be.undefined();
            });

            it('should not have called "initialize()" for a previously attempted connection', async () => {
                const managementClientSpy = Sinon.spy(
                    new ManagementClient(baseClientName, { ...defaultConfiguration, ...{ username: 'badUserName' } })
                );

                instance._clients.set(baseClientName, managementClientSpy);

                await instance.create(baseClientName, defaultConfiguration);

                expect(managementClientSpy.initialize.notCalled).to.be.true();
            });

            it('should reject with error when connection values are not supplied', async () => {
                await expect(instance.create(baseClientName)).to.reject(
                    Error,
                    'Expected connectionOptions to be supplied'
                );
            });
        });

        describe('contains', () => {
            const baseClientName = 'httpClientManager-containsClient';

            it('should return true when connection context exist', async () => {
                await instance.create(baseClientName, defaultConfiguration);

                const result = instance.contains(baseClientName);

                expect(result).to.be.true();
            });

            it('should return false when connection context does not exist', async () => {
                const result = instance.contains(baseClientName);

                expect(result).to.be.false();
            });
        });

        describe('get', () => {
            const baseClientName = 'httpClientManager-getClient';

            it('should return a connection context when it exist', async () => {
                const clientContext = await instance.create(baseClientName, defaultConfiguration);

                const result = instance.get(baseClientName);

                expect(result).to.exist();
                expect(result.name).to.equal(baseClientName);
                expect(result.connectionOptions).to.contains({
                    hostname: defaultConfiguration.hostname,
                    username: defaultConfiguration.username,
                    password: defaultConfiguration.password,
                    vhost: defaultConfiguration.vhost,
                    maxRetryCount: defaultConfiguration.maxRetryCount
                });
            });

            it('should be undefined when the connection context does not exist', async () => {
                const result = instance.get(baseClientName);

                expect(result).to.not.exist().and.to.be.undefined();
            });
        });

        describe('list', () => {
            const baseClientName = 'httpClientManager-listClient';

            it('should return 3 records when 3 were added', async () => {
                for (let i = 1; i <= 3; ++i) {
                    const clientName = `${baseClientName}-${i}`;

                    await instance.create(clientName, defaultConfiguration);
                }

                const results = instance.list();

                expect(results).to.have.length(3);
            });
        });
    });
});
