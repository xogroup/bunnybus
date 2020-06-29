'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

const payloadHeaders = {
    properties: {
        headers: {
            routeKey: 'a.b'
        }
    }
};

const payloadFields = {
    fields: {
        routingKey: 'a.c'
    }
};

const payload = {
    properties: payloadHeaders.properties,
    fields: payloadFields.fields
};

const message = {
    event: 'a.d'
};

const options = {
    routeKey: 'a.e'
};

describe('Helpers', () => {
    describe('reduceRouteKey', () => {
        it('should return from payload.properties.headers.routeKey when everything is supplied', () => {
            const result = Helpers.reduceRouteKey(payload, options, message);

            expect(result).to.be.equal(payload.properties.headers.routeKey);
        });

        it('should return from options.routeKey when payload contains fields.routingKey', () => {
            const result = Helpers.reduceRouteKey(payloadFields, options, message);

            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from options.routeKey when payload is empty', () => {
            const result = Helpers.reduceRouteKey({}, options, message);

            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from options.routeKey when payload is null', () => {
            const result = Helpers.reduceRouteKey(payloadFields, options, message);

            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from message.event when options is empty', () => {
            const result = Helpers.reduceRouteKey(payloadFields, {}, message);

            expect(result).to.be.equal(message.event);
        });

        it('should return from message.event when options is null', () => {
            const result = Helpers.reduceRouteKey(payloadFields, null, message);

            expect(result).to.be.equal(message.event);
        });

        it('should return from payload.fields.routingKey when options is empty and message is empty', () => {
            const result = Helpers.reduceRouteKey(payloadFields, {}, {});

            expect(result).to.be.equal(payloadFields.fields.routingKey);
        });

        it('should return from payload.fields.routingKey when options is null and message is null', () => {
            const result = Helpers.reduceRouteKey(payloadFields, null, null);

            expect(result).to.be.equal(payloadFields.fields.routingKey);
        });

        it('should return undefined when all input is falsy', () => {
            const result = Helpers.reduceRouteKey();

            expect(result).to.be.undefined();
        });
    });
});
