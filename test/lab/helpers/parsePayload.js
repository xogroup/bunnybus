'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('parsePayload', () => {
        it('should parse JSON payload', () => {
            const payload = {
                content: Buffer.from('{"hello":"world"}', 'utf-8')
            };

            expect(Helpers.parsePayload(payload)).to.contain({
                message: { hello: 'world' }
            });
        });

        it('should proxy buffer payload', () => {
            const buffer = Buffer.from('abcdefghijklmnopqrstuvwxyz', 'utf-8');

            const payload = {
                properties: {
                    headers: {
                        isBuffer: true
                    }
                },
                content: buffer
            };

            expect(Helpers.parsePayload(payload)).to.contain({
                message: buffer
            });
        });

        it('should return empty headers when payload header is missing', () => {
            const payload = {
                properties: {},
                content: Buffer.from('{"hello":"world"}', 'utf-8')
            };

            expect(Helpers.parsePayload(payload)).to.contain({
                metaData: {
                    headers: {}
                }
            });
        });

        it('should return empty headers when payload properties is missing', () => {
            const payload = {
                content: Buffer.from('{"hello":"world"}', 'utf-8')
            };

            expect(Helpers.parsePayload(payload)).to.contain({
                metaData: {
                    headers: {}
                }
            });
        });

        it('should return null when payload content is missing', () => {
            const payload = {};

            expect(Helpers.parsePayload(payload)).to.be.null();
        });

        it('should return null when payload content is empty string', () => {
            const payload = { content: '' };

            expect(Helpers.parsePayload(payload)).to.be.null();
        });

        it('should return null when payload content is non deserializable corrupted JSON buffer', () => {
            const buffer = Buffer.from('{"hello":"world"', 'utf-8');

            const payload = { content: buffer };

            expect(Helpers.parsePayload(payload)).to.be.null();
        });
    });
});
