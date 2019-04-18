'use strict';

const { expect } = require('@hapi/code');
const pkg = require('../../package.json');

const assertPublish = async ({
    instance,
    message,
    queueName,
    routeKey,
    transactionId,
    source,
    shouldRoute,
    publishOptions = {}
}) => {
    const options = {
        routeKey,
        transactionId,
        source,
        ...publishOptions
    };

    await instance.publish.bind(instance, message, options)();
    const payload = await instance.get.bind(instance, queueName)();

    if (!shouldRoute) {
        expect(payload).to.be.false();
        return;
    }

    const subscribedMessage = JSON.parse(payload.content.toString());
    expect(subscribedMessage).to.be.equal(message);
    expect(payload.properties.headers.transactionId).to.be.string();
    expect(payload.properties.headers.createdAt).to.exist();
    expect(payload.properties.headers.bunnyBus).to.exist();
    expect(payload.properties.headers.bunnyBus).to.be.equal(pkg.version);

    if (routeKey) {
        expect(payload.properties.headers.routeKey).to.be.equal(routeKey);
    } else {
        expect(payload.properties.headers.routeKey).to.be.equal(message.event);
    }

    if (source) {
        expect(payload.properties.headers.source).to.be.string();
        expect(payload.properties.headers.source).to.be.equal(source);
    }

    if (transactionId) {
        expect(payload.properties.headers.transactionId).to.be.equal(
            transactionId
        );
    }

    await instance.channel.ack(payload);
};

module.exports = assertPublish;
