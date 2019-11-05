'use strict';

const Code = require('code');
const Lab = require('lab');
const Bluebird = require('bluebird');
const Q = require('q');

const lab = exports.lab = Lab.script();
const before = lab.before;
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../../lib');

let instance = undefined;

describe('promise', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    it('should bootstrap with ES6 Promise', () => {

        expect(instance.promise).to.be.equal(Promise);
    });

    describe('custom promise', () => {

        beforeEach(() => {

            instance.promise = Promise;
        });

        it('should override with Bluebird', () => {

            instance.promise = Bluebird;

            expect(instance.promise).to.be.equal(Bluebird);
        });

        it('should not override with Q', () => {

            instance.promise = Q;

            expect(instance.promise).to.be.equal(Promise);
        });

        it('should override with Q when wrapped', () => {

            class QWrap {

                constructor(deferred) {

                    const task = Q.defer();

                    deferred(task.resolve, task.reject);

                    return task.promise;
                }
            }

            instance.promise = QWrap;

            expect(instance.promise).to.be.equal(QWrap);
        });
    });
});
