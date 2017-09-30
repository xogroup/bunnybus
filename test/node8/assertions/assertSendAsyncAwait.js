'use strict';

const Code = require('code');
const expect = Code.expect;

const assertSendAsyncAwait = async (instance, message, queueName, transactionId, source, routeKey) => {

    const options = {
        transactionId,
        source,
        routeKey
    };

    await instance.send(message, queueName, options);
    const payload = await instance.get(queueName, null);

    const sentMessage = JSON.parse(payload.content.toString());

    expect(sentMessage).to.be.equal(message);
    expect(payload.properties.headers.transactionId).to.be.string();
    expect(payload.properties.headers.createdAt).to.exist();

    if (source) {
        expect(payload.properties.headers.source).to.be.string();
    }

    if (transactionId) {
        expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
    }

    if (source) {
        expect(payload.properties.headers.source).to.be.equal(source);
    }

    if (routeKey) {
        expect(payload.properties.headers.routeKey).to.be.equal(routeKey);
    }

    if (message.event) {
        expect(payload.properties.headers.routeKey).to.be.equal(message.event);
    }

    return instance.channel.ack(payload);
};

module.exports = assertSendAsyncAwait;
