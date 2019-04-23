'use strict';

const { expect } = require('@hapi/code');
const Pkg = require('../../package.json');

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

    const {
        content,
        properties: { headers }
    } = payload;
    const subscribedMessage = JSON.parse(content.toString());
    expect(subscribedMessage).to.be.equal(message);
    expect(headers.transactionId).to.be.string();
    expect(headers.createdAt).to.exist();
    expect(headers.bunnyBus)
        .to.exist()
        .and.be.equal(Pkg.version);

    routeKey && expect(headers.routeKey).to.be.equal(routeKey);
    !routeKey && expect(headers.routeKey).to.be.equal(message.event);

    source &&
        expect(headers.source)
            .to.be.string()
            .and.be.equal(source);

    transactionId && expect(headers.transactionId).to.be.equal(transactionId);

    await instance.channel.ack(payload);
};

module.exports = assertPublish;
