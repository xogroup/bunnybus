'use strict';

const Code = require('@hapi/code');

const expect = Code.expect;

const assertGet = async (instance, channelContext, buffer, queueName, options) => {

    await channelContext.channel.sendToQueue(queueName, buffer, options);
    await channelContext.channel.waitForConfirms();

    const result = await instance.get(queueName);

    expect(result.content.toString()).to.equal(buffer.toString());
};

module.exports = assertGet;
