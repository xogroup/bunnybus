'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../../lib');

describe('configuration', () => {

    it('should generate an instance when valid configurations are passed to the constructor', (done) => {

        const config = {
            ssl : false,
            user : 'testUser',
            password : 'testPassword',
            server : 'test.rabbitmq.com',
            vhost : 'testVirtualHost',
            globalExchange : 'testExchange'
        };

        const instance = new BunnyBus(config);

        expect(instance.config).to.include(config);
        done();
    });

    it('should generate a connections string when default values are passed through the constructor', (done) => {

        const instance = new BunnyBus(BunnyBus.DEFAULT_SERVER_CONFIGURATION);

        expect(instance.connectionString).to.be.equal('amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000');
        done();
    });

    it('should generate a connections string when custom values are passed through the constructor', (done) => {

        const config = {
            ssl : true,
            user : 'testUser',
            password : 'testPassword',
            server : 'test.rabbitmq.com',
            vhost : 'testVirtualHost'
        };

        const instance = new BunnyBus(config);

        expect(instance.connectionString).to.be.equal('amqps://testUser:testPassword@test.rabbitmq.com:5672/testVirtualHost?heartbeat=2000');
        done();
    });

    it('should generate a connection string with default values', (done) => {

        const instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

        expect(instance.connectionString).to.be.equal('amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000');
        done();
    });

    it('should generate a connection string with custom values', (done) => {

        const config = {
            ssl : true,
            user : 'testUser',
            password : 'testPassword',
            server : 'test.rabbitmq.com',
            vhost : 'testVirtualHost'
        };

        const instance = new BunnyBus();
        instance.config = config;

        expect(instance.connectionString).to.be.equal('amqps://testUser:testPassword@test.rabbitmq.com:5672/testVirtualHost?heartbeat=2000');
        done();
    });
});
