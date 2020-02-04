'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Events = require('../../../lib/events');
const BunnyBus = require('../../../lib/index');
const { ConnectionManager } = require('../../../lib/states');

const { describe, beforeEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('state management', () => {

    describe('Connection Manager', () => {

        let instance = undefined;
        let defaultConfiguration = undefined;

        beforeEach(() => {

            instance = new ConnectionManager();
            defaultConfiguration = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        });

        describe('create', () => {

            const baseConnectionName = 'connection-createConnection';

            it('should create a connection with default values', async () => {

                await instance.create(baseConnectionName, defaultConfiguration);

                const result = instance._connections.get(baseConnectionName);

                expect(result).to.exist();
                expect(result).to.be.an.object();
                expect(result.connectionOptions).to.exist();
                expect(result.connectionOptions).to.contain(defaultConfiguration);
                expect(result.connection).to.exist();
                expect(result.connection).to.be.an.object();
            });

            it('should create a connection with defaults values while supplied with empty net/tls options', async () => {

                await instance.create(baseConnectionName, defaultConfiguration, {});

                const result = instance._connections.get(baseConnectionName);

                expect(result).to.exist();
                expect(result).to.be.an.object();
                expect(result.connectionOptions).to.exist();
                expect(result.connectionOptions).to.contain(defaultConfiguration);
                expect(result.connection).to.exist();
                expect(result.connection).to.be.an.object();
            });

            it('should create a connection with defaults values while supplied with partially filled net/tls options', async () => {

                await instance.create(baseConnectionName, defaultConfiguration, { allowHalfOpen: true });

                const result = instance._connections.get(baseConnectionName);

                expect(result).to.exist();
                expect(result).to.be.an.object();
                expect(result.connectionOptions).to.exist();
                expect(result.connectionOptions).to.contain(defaultConfiguration);
                expect(result.connection).to.exist();
                expect(result.connection).to.be.an.object();
            });

            it('should return same connection when request are called concurrently', async () => {

                const [result1, result2] = await Promise.all([
                    instance.create(baseConnectionName, defaultConfiguration),
                    instance.create(baseConnectionName, defaultConfiguration)
                ]);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
            });

            it('should return same connection when request are called sequentially', async () => {

                const result1 = await instance.create(baseConnectionName, defaultConfiguration);
                const result2 = await instance.create(baseConnectionName, defaultConfiguration);

                expect(result1).to.exist();
                expect(result2).to.exist();
                expect(result1).to.shallow.equal(result2);
                expect(result1.connection).to.shallow.equal(result2.connection);
            });

            it('should error when no connection options is supplied', async () => {

                let sut = null;

                try {
                    await instance.create(baseConnectionName);
                }
                catch (err) {
                    sut = err;
                }

                expect(sut).to.exist();
                expect(sut).to.be.an.error('Expected connectionOptions to be supplied');
            });

            it('should error when a misconfigured object is supplied', { timeout: 10000 }, async () => {

                let sut = null;

                try {
                    await instance.create(baseConnectionName, { port: 60000, connectionRetryCount: 1 });
                }
                catch (err) {
                    sut = err;
                }

                expect(sut).to.exist();
                expect(sut).to.be.an.error('Exceeded maximum attempts of retries');
            });
        });

        describe('contains', () => {

            const baseConnectionName = 'connection-containsConnection';

            it('should return true when connection context exist', async () => {

                await instance.create(baseConnectionName, defaultConfiguration);

                const result = instance.contains(baseConnectionName);

                expect(result).to.be.true();
            });

            it('should return false when connection context does not exist', async () => {

                const result = instance.contains(baseConnectionName);

                expect(result).to.be.false();
            });
        });

        describe('get', () => {

            const baseConnectionName = 'connection-getConnection';

            it('should return a connection context when it exist', async () => {

                const connectionContext = await instance.create(baseConnectionName, defaultConfiguration);

                const result = instance.get(baseConnectionName);

                expect(result).to.exist();
                expect(result.name).to.equal(baseConnectionName);
                expect(result.connectionOptions).to.contains(defaultConfiguration);
                expect(result.connection).to.shallow.equal(connectionContext.connection);
            });

            it('should be undefined when the connection context does not exist', async () => {

                const result = instance.get(baseConnectionName);

                expect(result).to.not.exist();
                expect(result).to.be.undefined();
            });
        });

        describe('getConnection', () => {

            const baseConnectionName = 'connection-getConnectionConnection';

            it('should return a connection when it exist', async () => {

                const connectionContext = await instance.create(baseConnectionName, defaultConfiguration);

                const result = instance.getConnection(baseConnectionName);

                expect(result).to.exist();
                expect(result).to.shallow.equal(connectionContext.connection);
            });

            it('should be undefined when the connection does not exist', async () => {

                const result = instance.get(baseConnectionName);

                expect(result).to.not.exist();
                expect(result).to.be.undefined();
            });
        });

        describe('close', () => {

            const baseConnectionName = 'connection-closeConnection';

            it('should close connection when it exist', async () => {

                await instance.create(baseConnectionName, defaultConfiguration);

                await instance.close(baseConnectionName);

                const result = instance._connections.get(baseConnectionName);

                expect(result).to.exist();
                expect(result.name).to.equal(baseConnectionName);
                expect(result.connection).to.not.exist();
                expect(result.connection).to.be.undefined();
            });
        });

        describe('Events', () => {

            const baseConnectionName = 'connection-events';
            let connectionContext = undefined;

            beforeEach(async () => {

                connectionContext = await instance.create(baseConnectionName, defaultConfiguration);
            });

            it('should emit AMQP_CONNECTION_CLOSE_EVENT when connection closes', async () => {

                const promise = new Promise((resolve) => {

                    connectionContext.once(Events.AMQP_CONNECTION_CLOSE_EVENT, resolve);
                });

                connectionContext.connection.emit('close');

                await promise;
            });

            it('should emit AMQP_CONNECTION_ERROR_EVENT when connection errors', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    connectionContext.once(Events.AMQP_CONNECTION_ERROR_EVENT, (err) => {

                        result = err;
                        resolve();
                    });
                });

                connectionContext.connection.emit('error', new Error('test'));

                await promise;

                expect(result).to.exist();
                expect(result).to.be.an.error('test');
            });

            it('should emit AMQP_CONNECTION_BLOCKED_EVENT when connection is blocked', async () => {

                let result = null;

                const promise = new Promise((resolve) => {

                    connectionContext.once(Events.AMQP_CONNECTION_BLOCKED_EVENT, (reason) => {

                        result = reason;
                        resolve();
                    });
                });

                connectionContext.connection.emit('blocked', 'low memory');

                await promise;

                expect(result).to.exist();
                expect(result).to.equal('low memory');
            });

            it('should emit AMQP_CONNECTION_UNBLOCKED_EVENT when connection is unblocked', async () => {

                const promise = new Promise((resolve) => {

                    connectionContext.once(Events.AMQP_CONNECTION_UNBLOCKED_EVENT, resolve);
                });

                connectionContext.connection.emit('unblocked');

                await promise;
            });
        });
    });
});
