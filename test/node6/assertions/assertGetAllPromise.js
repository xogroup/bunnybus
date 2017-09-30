'use strict';

const Promise = require('bluebird');
const Code = require('code');
const expect = Code.expect;

const assertGetAllPromise = (instance, message, queueName, meta, limit) => {

    return new Promise((resolve, reject) => {

        const callbackLimit = limit + 1;
        let callbackCounter = 0;

        const options = {
            meta
        };

        const callbackReconciler = () => {

            if (++callbackCounter === callbackLimit) {
                resolve();
            }
        };

        const handlerWithoutMeta = (sentMessage, ack) => {

            expect(sentMessage).to.be.equal(message);
            ack(callbackReconciler);
        };

        const handlerWithMeta = (sentMessage, sentMeta, ack) => {

            expect(sentMessage).to.be.equal(message);
            expect(sentMeta).to.exist();

            ack(callbackReconciler);
        };

        const handler = meta ? handlerWithMeta : handlerWithoutMeta;

        Promise
            .resolve()
            .then(() => Promise.mapSeries(new Array(limit), () => instance.send(message, queueName)))
            .then(() => instance.getAll(queueName, handler, options))
            .then(callbackReconciler)
            .catch(reject);
    });
};

module.exports = assertGetAllPromise;
