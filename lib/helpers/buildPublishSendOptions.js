'use strict';

const CleanObject = require('./cleanObject');

module.exports = ({ options, headers }) => {
    //get props from original options
    const {
        expiration,
        userId,
        CC,
        priority,
        persistent,
        deliveryMode,
        mandatory,
        BCC,
        contentType,
        contentEncoding,
        correlationId,
        replyTo,
        messageId,
        timestamp,
        type,
        appId
    } = options | {};

    //build cleaned up options by removing null, undefined
    const output = {
        expiration,
        userId,
        CC,
        priority,
        persistent,
        deliveryMode,
        mandatory,
        BCC,
        contentType,
        contentEncoding,
        correlationId,
        replyTo,
        messageId,
        timestamp,
        type,
        appId,
        headers
    };
    CleanObject(output);

    return output;
};