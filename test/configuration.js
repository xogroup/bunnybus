'use strict';

const { expect } = require('@hapi/code');

const { describe, it } = (exports.lab = require('@hapi/lab').script());
const BunnyBus = require('../lib');

describe('configuration', () => {
    it('should generate an instance when valid configurations are passed to the constructor', () => {
        const config = {
            ssl: false,
            user: 'testUser',
            password: 'testPassword',
            server: 'test.rabbitmq.com',
            vhost: 'testVirtualHost',
            globalExchange: 'testExchange'
        };

        const instance = new BunnyBus(config);

        expect(instance.config).to.include(config);
    });

    it('should generate a connections string when default values are passed through the constructor', () => {
        const instance = new BunnyBus(BunnyBus.Defaults.SERVER_CONFIGURATION);

        expect(instance.connectionString).to.be.equal(
            'amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=60'
        );
    });

    it('should generate a connections string when custom values are passed through the constructor', () => {
        const config = {
            ssl: true,
            user: 'testUser',
            password: 'testPassword',
            server: 'test.rabbitmq.com',
            vhost: 'testVirtualHost'
        };

        const instance = new BunnyBus(config);

        expect(instance.connectionString).to.be.equal(
            'amqps://testUser:testPassword@test.rabbitmq.com:5672/testVirtualHost?heartbeat=60'
        );
    });

    it('should generate a connection string with default values', () => {
        const instance = new BunnyBus();
        instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;

        expect(instance.connectionString).to.be.equal(
            'amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=60'
        );
    });

    it('should generate a connection string with custom values', () => {
        const config = {
            ssl: true,
            user: 'testUser',
            password: 'testPassword',
            server: 'test.rabbitmq.com',
            vhost: 'testVirtualHost'
        };

        const instance = new BunnyBus();
        instance.config = config;

        expect(instance.connectionString).to.be.equal(
            'amqps://testUser:testPassword@test.rabbitmq.com:5672/testVirtualHost?heartbeat=60'
        );
    });
});
