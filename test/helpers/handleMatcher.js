'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('handleMatcher', () => {
        it('should not match any handler', () => {
            const handlers = {
                'abc.#.xyz': () => {},
                'abc.*.hello.world': () => {},
                'abc.xyz': () => {}
            };

            const result = Helpers.handlerMatcher(handlers, 'world.hello');

            expect(result).to.be.an.array();
            expect(result).to.have.length(0);
        });

        it('should match a single handler', () => {
            const handlers = {
                'hello.world': () => {},
                'world.hello': () => {}
            };

            const result = Helpers.handlerMatcher(handlers, 'world.hello');

            expect(result).to.be.an.array();
            expect(result).to.have.length(1);
        });

        it('should match multiple handlers', () => {
            const handlers = {
                'abc.#.xyz': () => {},
                'abc.*.xyz': () => {},
                'abc.xyz': () => {}
            };

            const result = Helpers.handlerMatcher(handlers, 'abc.hello.xyz');

            expect(result).to.be.an.array();
            expect(result).to.have.length(2);
        });
    });
});
