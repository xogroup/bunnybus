'use strict';

const { expect } = require('@hapi/code');

const assertGetAll = async ({ instance, message, queueName, meta, limit }) => {
    const options = {
        meta
    };
    let handlerCounter = 0;

    const handlerWithoutMeta = async (sentMessage, ack) => {
        expect(sentMessage).to.be.equal(message);
        await ack();
        handlerCounter++;
    };

    const handlerWithMeta = async (sentMessage, sentMeta, ack) => {
        expect(sentMessage).to.be.equal(message);
        expect(sentMeta).to.exist();
        await ack();
        handlerCounter++;
    };

    const handler = meta ? handlerWithMeta : handlerWithoutMeta;

    const times = new Array(limit);
    times.fill('');

    await Promise.all(
        times.map(async () => await instance.send(message, queueName))
    );

    await instance.getAll(queueName, handler, options);

    expect(handlerCounter).to.equal(limit);
};

module.exports = assertGetAll;
