'use strict';

const Async = require('async');
const Code = require('code');
const expect = Code.expect;

const assertSend = (instance, message, queueName, transactionId, source, routeKey, miscOptions, callback) => {

    const options = {
        transactionId,
        source,
        routeKey
    };

    if (typeof miscOptions === 'object' && miscOptions !== null){
        Object.assign(options, miscOptions);
    }

    Async.waterfall([
        instance.send.bind(instance, message, queueName, options),
        instance.get.bind(instance, queueName, null)
    ],
    (err, payload) => {

        const sentMessage = JSON.parse(payload.content.toString());
        expect(err).to.not.exist();
        expect(sentMessage).to.be.equal(message);
        expect(payload.properties.headers.transactionId).to.be.string();
        expect(payload.properties.headers.createdAt).to.exist();
        expect(payload.properties.headers.bunnyBus).to.exist();
        expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../../package.json').version);

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

        instance.channel.ack(payload);

        callback();
    });
};

module.exports = assertSend;
