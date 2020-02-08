'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Bluebird = require('bluebird');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

const callback = () => {};

describe('Helpers', () => {

    describe('toPromise', () => {

        describe('ES6 Promise', () => {

            it('should promisify methods using the native implementation', () => {

                const task = Helpers.toPromise(Promise, callback);

                expect(task).to.be.instanceof(Promise);
                expect(task.then).to.be.a.function();
            });
        });

        describe('Bluebird Promise', () => {

            it('should promisify methods using the Bluebird implementation', () => {

                const task = Helpers.toPromise(Bluebird, callback);

                expect(task).to.be.instanceof(Bluebird);
                expect(task.then).to.be.a.function();
            });
        });
    });
});
