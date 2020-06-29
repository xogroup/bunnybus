'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Crypto = require('crypto');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('buildPublishOrSendOptions', () => {
        it('should return a reflective object of the input values', () => {
            const amqpOptions = {
                expiration: '1000',
                userId: 'guest',
                CC: 'a',
                priority: 1,
                persistent: false,
                deliveryMode: false,
                mandatory: false,
                BCC: 'b',
                contentType: 'text/plain',
                contentEncoding: 'text/plain',
                correlationId: 'some_id',
                replyTo: 'other_queue',
                messageId: 'message_id',
                timestamp: 1555099550198,
                type: 'some_type',
                appId: 'test_app'
            };

            const headers = {
                transactionId: Crypto.randomBytes(20).toString('hex'),
                isBuffer: true,
                source: 'foo',
                routeKey: 'bar',
                createdAt: new Date().toISOString(),
                bunnyBus: require('../../../package.json').version
            };

            const result = Helpers.buildPublishOrSendOptions(amqpOptions, headers);

            expect(result).to.contain(Object.assign(amqpOptions, { headers }));
        });

        it('should not add any options not in the whitelist', () => {
            const options = {
                foo: 'bar'
            };

            const headers = {
                hello: 'world'
            };

            const result = Helpers.buildPublishOrSendOptions(options, headers);

            expect(result).to.contain({ headers });
            expect(result.foo).to.not.exist();
        });

        it('should not add any options in a whitelist that is null', () => {
            const options = {
                expiration: null
            };

            const headers = {
                hello: 'world'
            };

            const result = Helpers.buildPublishOrSendOptions(options, headers);

            expect(result).to.contain({ headers });
            expect(result.expiration).to.not.exist();
        });

        it('should not add any options when provided options is a string', () => {
            const headers = {
                hello: 'world'
            };

            const result = Helpers.buildPublishOrSendOptions('foo.bar', headers);

            expect(result).to.contain({ headers });
            expect(result['foo.bar']).to.not.exist();
        });

        it('should not add any options when provided options is null', () => {
            const headers = {
                hello: 'world'
            };

            const result = Helpers.buildPublishOrSendOptions(null, headers);

            expect(result).to.contain({ headers });
        });

        it('should not add any options when provided options is undefined', () => {
            const headers = {
                hello: 'world'
            };

            const result = Helpers.buildPublishOrSendOptions(undefined, headers);

            expect(result).to.contain({ headers });
        });
    });
});
