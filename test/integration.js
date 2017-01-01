'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const before = lab.before;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../lib');
let instance = undefined;

describe('integration tests', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_CONFIGURATION;
        done();
    });

    describe('connection', () => {

        before((done) => {

            instance.closeConnection(done);
        });

        afterEach((done) => {

            instance.closeConnection(done);
        });

        it('should create connection with default values', (done) => {

            instance.createConnection((err) => {

                expect(err).to.be.null();
                expect(instance.connection).to.exist();
                done();
            });
        });

        it('should close an opened connection', (done) => {

            Async.waterfall([
                instance.createConnection.bind(instance),
                instance.closeConnection.bind(instance)
            ], (err) => {

                expect(err).to.be.null();
                expect(instance.connection).to.be.null();
                done(err);
            });
        });
    });

    describe('channel', () => {

        before((done) => {

            instance.closeChannel(done);
        });

        beforeEach((done) => {

            instance.createConnection(done);
        });

        afterEach((done) => {

            instance.closeChannel(done);
        });

        it('should create channel with default values', (done) => {

            instance.createChannel((err) => {

                expect(err).to.be.null();
                expect(instance.channel).to.exist();
                done();
            });
        });

        it('should close an opened channel', (done) => {

            Async.waterfall([
                instance.createChannel.bind(instance),
                instance.closeChannel.bind(instance)
            ], (err) => {

                expect(err).to.be.null();
                expect(instance.channel).to.be.null();
                done(err);
            });
        });

        it('should close both connection and channel when closing a connection', (done) => {

            Async.waterfall([
                instance.createChannel.bind(instance),
                instance.closeConnection.bind(instance)
            ], (err) => {

                expect(err).to.be.null();
                expect(instance.connection).to.be.null();
                expect(instance.channel).to.be.null();
                done(err);
            });
        });
    });
});

