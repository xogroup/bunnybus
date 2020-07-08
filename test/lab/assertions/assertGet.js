'use strict';

const Code = require('@hapi/code');
const BunnyBus = require('../../../lib');

const expect = Code.expect;

const assertGet = async (instance, channelContext, connectionManager, channelManager, buffer, queueName, options) => {
    await channelContext.channel.sendToQueue(queueName, buffer, options);
    await channelContext.channel.waitForConfirms();

    if (connectionManager) {
        await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);
    }

    if (channelManager) {
        await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(queueName));
    }

    const result = await instance.get({ queue: queueName });

    expect(result.content.toString()).to.equal(buffer.toString());
};

module.exports = assertGet;
