'use strict';

const { expect } = require('@hapi/code');
const pkg = require('../../package.json');

const assertSend = async ({
    instance,
    message,
    queueName,
    transactionId,
    source,
    routeKey,
    sendOptions = {}
}) => {
    const options = {
        transactionId,
        source,
        routeKey,
        ...sendOptions
    };

    await instance.send.bind(instance, message, queueName, options)();
    const payload = await instance.get.bind(instance, queueName, null)();

    const sentMessage = JSON.parse(payload.content.toString());
    expect(sentMessage).to.be.equal(message);
    expect(payload.properties.headers.transactionId).to.be.string();
    expect(payload.properties.headers.createdAt).to.exist();
    expect(payload.properties.headers.bunnyBus).to.exist();
    expect(payload.properties.headers.bunnyBus).to.be.equal(pkg.version);

    if (source) {
        expect(payload.properties.headers.source).to.be.string();
    }

    if (transactionId) {
        expect(payload.properties.headers.transactionId).to.be.equal(
            transactionId
        );
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

    await instance.channel.ack(payload);
};

module.exports = assertSend;
