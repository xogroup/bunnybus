'use strict';

const { expect } = require('@hapi/code');
const Pkg = require('../../package.json');

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
    const {
        content,
        properties: { headers }
    } = payload;

    const sentMessage = JSON.parse(content.toString());
    expect(sentMessage).to.be.equal(message);
    expect(headers.transactionId).to.be.string();
    expect(headers.createdAt).to.exist();
    expect(headers.bunnyBus)
        .to.exist()
        .and.be.equal(Pkg.version);

    source &&
        expect(headers.source)
            .to.be.string()
            .and.to.be.equal(source);

    transactionId && expect(headers.transactionId).to.be.equal(transactionId);
    routeKey && expect(headers.routeKey).to.be.equal(routeKey);
    message.event && expect(headers.routeKey).to.be.equal(message.event);

    await instance.channel.ack(payload);
};

module.exports = assertSend;
