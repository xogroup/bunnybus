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

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    it('should bootstrap with ES6 Promise', (done) => {

        expect(instance.promise).to.be.equal(Promise);
        done();
    });

    describe('custom promise', () => {

        beforeEach((done) => {

            instance.promise = Promise;
            done();
        });

        it('should override with Bluebird', (done) => {

            instance.promise = Bluebird;

            expect(instance.promise).to.be.equal(Bluebird);
            done();
        });

        it('should not override with Q', (done) => {

            instance.promise = Q;

            expect(instance.promise).to.be.equal(Promise);
            done();
        });

        it('should override with Q when wrapped', (done) => {

            class QWrap {

                constructor(deferred) {

                    const task = Q.defer();

                    deferred(task.resolve, task.reject);

                    return task.promise;
                }
            }

            instance.promise = QWrap;

            expect(instance.promise).to.be.equal(QWrap);
            done();
        });
    });
});
