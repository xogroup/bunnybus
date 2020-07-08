'use strict';

const Code = require('@hapi/code');
const BunnyBus = require('../../../lib');

const expect = Code.expect;

const assertGetAll = async (instance, channelContext, connectionManager, channelManager, message, queueName, limit) => {
    const buffer = Buffer.from(JSON.stringify(message));

    let handleCounter = 0;

    const options = {};

    const handler = async ({ message: sentMessage, metaData: sentMeta, ack }) => {
        ++handleCounter;

        expect(sentMessage).to.be.equal(message);
        expect(sentMeta).to.exist();

        await ack();
    };

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

    await instance.getAll({ queue: queueName, handler, options });

    expect(handleCounter).to.equal(limit);
};

module.exports = assertGetAll;
