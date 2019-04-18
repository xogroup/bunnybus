'use strict';

const Async = require('async');
const Code = require('code');
const expect = Code.expect;

const assertPublish = (instance, message, queueName, routeKey, transactionId, source, shouldRoute, miscOptions, callback) => {

    const options = {
        routeKey,
        transactionId,
        source
    };

    if (typeof miscOptions === 'object' && miscOptions !== null){
        Object.assign(options, miscOptions);
    }

    Async.waterfall([
        instance.publish.bind(instance, message, options),
        instance.get.bind(instance, queueName, null)
    ],
    (err, payload) => {

        if (shouldRoute) {
            const subscribedMessage = JSON.parse(payload.content.toString());
            expect(err).to.not.exist();
            expect(subscribedMessage).to.be.equal(message);
            expect(payload.properties.headers.transactionId).to.be.string();
            expect(payload.properties.headers.createdAt).to.exist();
            expect(payload.properties.headers.bunnyBus).to.exist();
            expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../../package.json').version);

            if (routeKey) {
                expect(payload.properties.headers.routeKey).to.be.equal(routeKey);
            }
            else {
                expect(payload.properties.headers.routeKey).to.be.equal(message.event);
            }

            if (source) {
                expect(payload.properties.headers.source).to.be.string();
                expect(payload.properties.headers.source).to.be.equal(source);
            }

            if (transactionId) {
                expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
            }

            instance.channel.ack(payload);
        }
        else {
            expect(err).to.not.exist();
            expect(payload).to.be.false();
        }

        callback();
    });
};

module.exports = assertPublish;
