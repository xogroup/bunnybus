'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../lib/helpers');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Helpers', () => {

    describe('coercePayload', () => {

        it('should return a correct payload unmodified', () => {

            const inputPayload = {
                properties: {
                    headers: {}
                },
                content: Buffer.alloc(16)
            };

            const normalizedPayload = Helpers.coercePayload(inputPayload);

            expect(normalizedPayload.properties).to.exist();
            expect(normalizedPayload.properties.headers).to.exist();
            expect(normalizedPayload.content).to.exist();
        });

        it('should correct a payload missing content', () => {

            const inputPayload = {
                properties: {
                    headers: {}
                }
            };

            const normalizedPayload = Helpers.coercePayload(inputPayload);

            expect(normalizedPayload.properties).to.exist();
            expect(normalizedPayload.properties.headers).to.exist();
            expect(normalizedPayload.content).to.exist();
        });

        it('should correct a payload missing headers', () => {

            const inputPayload = {
                properties: {},
                content: Buffer.alloc(16)
            };

            const normalizedPayload = Helpers.coercePayload(inputPayload);

            expect(normalizedPayload.properties).to.exist();
            expect(normalizedPayload.properties.headers).to.exist();
            expect(normalizedPayload.content).to.exist();
        });

        it('should correct a payload missing properties', () => {

            const inputPayload = {
                content: Buffer.alloc(16)
            };

            const normalizedPayload = Helpers.coercePayload(inputPayload);

            expect(normalizedPayload.properties).to.exist();
            expect(normalizedPayload.properties.headers).to.exist();
            expect(normalizedPayload.content).to.exist();
        });
    });
});
