'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('BunnyBus', () => {

    describe.only('configuration', () => {

        it('should generate an instance when valid configurations are passed to the constructor', () => {

            const config = {
                username : 'testUser',
                password : 'testPassword',
                hostname : 'test.rabbitmq.com',
                vhost : 'testVirtualHost',
                globalExchange : 'testExchange'
            };

            const instance = new BunnyBus(config);

            expect(instance.config).to.include(config);
        });

        it('should generate a connections string when default values are passed through the constructor', () => {

            const instance = new BunnyBus(BunnyBus.DEFAULT_SERVER_CONFIGURATION);

            expect(instance.connectionString).to.be.equal('amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000');
        });

        it('should generate a connections string when custom values are passed through the constructor', () => {

            const config = {
                protocol : 'amqps',
                username : 'testUser',
                password : 'testPassword',
                hostname : 'test.rabbitmq.com',
                vhost : 'testVirtualHost'
            };

            const instance = new BunnyBus(config);

            expect(instance.connectionString).to.be.equal('amqps://testUser:testPassword@test.rabbitmq.com:5672/testVirtualHost?heartbeat=2000');
        });

        it('should generate a connection string with default values', () => {

            const instance = new BunnyBus();
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

            expect(instance.connectionString).to.be.equal('amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000');
        });

        it('should generate a connection string with custom values', () => {

            const config = {
                protocol : 'amqps',
                username : 'testUser',
                password : 'testPassword',
                hostname : 'test.rabbitmq.com',
                vhost : 'testVirtualHost'
            };

            const instance = new BunnyBus();
            instance.config = config;

            expect(instance.connectionString).to.be.equal('amqps://testUser:testPassword@test.rabbitmq.com:5672/testVirtualHost?heartbeat=2000');
        });
    });
});
