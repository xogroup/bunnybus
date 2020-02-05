'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Events = require('../../../lib/events');
const BunnyBus = require('../../../lib');
const { ChannelManager, ConnectionManager } = require('../../../lib/states');
const Exceptions = require('../../../lib/exceptions');

const { describe, before, beforeEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;

describe('BunnyBus', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('private methods', () => {

        describe('_getChannel', () => {

            const baseChannelName = 'bunnybus-_getChannel';

            it('should establish a new connection and channel when none exist', async () => {

                await instance._getChannel(baseChannelName);
            });

            it('should establish a new channel when none exist', async () => {

            });

            it('should ');
        });
    });
});
