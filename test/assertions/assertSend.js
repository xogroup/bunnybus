'use strict';

const Code = require('@hapi/code');

const expect = Code.expect;

const assertSend = async (instance, channelContext, message, queueName, transactionId, source, routeKey, miscOptions) => {

    const options = {
        transactionId,
        source,
        routeKey
    };

    if (typeof miscOptions === 'object' && miscOptions !== null) {
        Object.assign(options, miscOptions);
    }

    await instance.send(message, queueName, options);

    if (!channelContext.channel) {
        await instance._autoBuildChannelContext(channelContext.name);
    }

    const result = await channelContext.channel.get(queueName);

    const sentMessage = JSON.parse(result.content.toString());

    expect(sentMessage).to.be.equal(message);
    expect(result.properties.headers.transactionId).to.be.string();
    expect(result.properties.headers.createdAt).to.exist();
    expect(result.properties.headers.bunnyBus).to.exist();
    expect(result.properties.headers.bunnyBus).to.be.equal(require('../../package.json').version);

    if (source) {
        expect(result.properties.headers.source).to.be.string();
    }

    if (transactionId) {
        expect(result.properties.headers.transactionId).to.be.equal(transactionId);
    }

    if (source) {
        expect(result.properties.headers.source).to.be.equal(source);
    }

    if (routeKey) {
        expect(result.properties.headers.routeKey).to.be.equal(routeKey);
    }

    if (message.event) {
        expect(result.properties.headers.routeKey).to.be.equal(message.event);
    }

    channelContext.channel.ack(result);
};

module.exports = assertSend;
