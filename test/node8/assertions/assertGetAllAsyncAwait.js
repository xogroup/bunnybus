'use strict';

const Promise = require('bluebird');
const Code = require('code');
const expect = Code.expect;

const assertGetAsyncAwait = async (instance, message, queueName, meta, limit) => {

    const callbackLimit = limit + 1;
    let callbackCounter = 0;

    const options = {
        meta
    };

    const callbackAccountant = () => {

        ++callbackCounter;
    };

    const handlerWithoutMeta = (sentMessage, ack) => {

        expect(sentMessage).to.be.equal(message);
        ack(callbackAccountant);
    };

    const handlerWithMeta = (sentMessage, sentMeta, ack) => {

        expect(sentMessage).to.be.equal(message);
        expect(sentMeta).to.exist();

        ack(callbackAccountant);
    };

    const handler = meta ? handlerWithMeta : handlerWithoutMeta;
    const tasks = [];

    for (let i = 0; i < limit; ++i) {
        tasks.push(instance.send(message, queueName));
    }

    await Promise.all(tasks);
    await instance.getAll(queueName, handler, options);

    if (callbackCounter === callbackLimit) {
        return Promise.resolve();
    }

    return Promise.reject();
};

module.exports = assertGetAsyncAwait;
