'use strict';

const Async = require('async');
const Code = require('code');
const expect = Code.expect;

const AssertPublish = (instance, message, queueName, routeKey, transactionId, callingModule, shouldRoute, callback) => {

    const options = {
        routeKey,
        transactionId,
        callingModule
    };

    Async.waterfall([
        instance.publish.bind(instance, message, options),
        instance.get.bind(instance, queueName, null)
    ],
    (err, payload) => {

        if (shouldRoute) {
            const subscribedMessage = JSON.parse(payload.content.toString());
            expect(err).to.be.null();
            expect(subscribedMessage).to.equal(message);
            expect(payload.properties.headers.transactionId).to.be.string();
            expect(payload.properties.headers.createdAt).to.exist();

            if (callingModule) {
                expect(payload.properties.headers.callingModule).to.be.string();
            }

            if (transactionId) {
                expect(payload.properties.headers.transactionId).to.equal(transactionId);
            }

            if (callingModule) {
                expect(payload.properties.headers.callingModule).to.equal(callingModule);
            }

            instance.channel.ack(payload);
        }
        else {
            expect(err).to.be.null();
            expect(payload).to.be.false();
        }

        callback();
    });
};

module.exports = AssertPublish;
