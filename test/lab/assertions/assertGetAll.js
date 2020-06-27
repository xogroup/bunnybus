'use strict';

const Code = require('@hapi/code');
const BunnyBus = require('../../../lib');

const expect = Code.expect;

const assertGetAll = async (
    instance,
    channelContext,
    connectionManager,
    channelManager,
    message,
    queueName,
    meta,
    limit
) => {
    const buffer = Buffer.from(JSON.stringify(message));

    let handleCounter = 0;

    const options = {
        meta
    };

    const handlerWithoutMeta = async (sentMessage, ack) => {
        ++handleCounter;

        expect(sentMessage).to.be.equal(message);

        await ack();
    };

    const handlerWithMeta = async (sentMessage, sentMeta, ack) => {
        ++handleCounter;

        expect(sentMessage).to.be.equal(message);
        expect(sentMeta).to.exist();

        await ack();
    };

    const handler = meta ? handlerWithMeta : handlerWithoutMeta;

    for (let i = 0; i < limit; ++i) {
        await channelContext.channel.sendToQueue(queueName, buffer);
    }

    await channelContext.channel.waitForConfirms();

    if (connectionManager) {
        await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
    }

    if (channelManager) {
        await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(queueName));
    }

    await instance.getAll(queueName, handler, options);

    expect(handleCounter).to.equal(limit);
};

module.exports = assertGetAll;
