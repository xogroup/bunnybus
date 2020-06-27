'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Sinon = require('sinon');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let stub = undefined;
const connectionManager = undefined;
const channelManager = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
    });

    describe('public getter/setters', () => {
        describe('healthy', () => {
            before(() => {
                expect(instance.connections.healthy).to.be.true();
                expect(instance.channels.healthy).to.be.true();
            });

            describe('when connection manager and channel managers are healthy', () => {
                it('should be true', async () => {
                    const result = instance.healthy;

                    expect(result).to.be.true();
                });
            });

            describe('when connection manager is unhealthy', () => {
                before(() => {
                    stub = Sinon.stub(instance.connections, 'healthy').get(() => false);

                    expect(instance.connections.healthy).to.be.false();
                    expect(instance.channels.healthy).to.be.true();
                });

                after(() => {
                    stub.restore();
                });

                it('should be false', async () => {
                    const result = instance.healthy;

                    expect(result).to.be.false();
                });
            });

            describe('when channel manager is unhealthy', () => {
                before(() => {
                    stub = Sinon.stub(instance.channels, 'healthy').get(() => false);

                    expect(instance.connections.healthy).to.be.true();
                    expect(instance.channels.healthy).to.be.false();
                });

                after(() => {
                    stub.restore();
                });

                it('should be false', async () => {
                    const result = instance.healthy;

                    expect(result).to.be.false();
                });
            });
        });
    });
});
