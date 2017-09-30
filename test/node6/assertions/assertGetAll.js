'use strict';

const Async = require('async');
const Code = require('code');
const expect = Code.expect;

const assertGetAll = (instance, message, queueName, meta, limit, callback) => {

    const callbackLimit = limit + 1;
    let callbackCounter = 0;

    const options = {
        meta
    };

    const callbackReconciler = () => {

        if (++callbackCounter === callbackLimit) {
            callback();
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

    Async.waterfall([
        (cb) => {

            Async.times(
                limit,
                (n, next) => instance.send(message, queueName, next),
                cb
            );
        },
        (result, cb) => instance.getAll(queueName, handler, options, cb)
    ],
    (err) => {

        expect(err).to.not.exist();
        callbackReconciler();
    });
};

module.exports = assertGetAll;
