'use strict';

const buildPublishOrSendOptions = (options, headers) => {
    const SEND_OR_PUBLISH_OPTION_KEYS = [
        'expiration',
        'userId',
        'CC',
        'priority',
        'persistent',
        'deliveryMode',
        'mandatory',
        'BCC',
        'contentType',
        'contentEncoding',
        'correlationId',
        'replyTo',
        'messageId',
        'timestamp',
        'type',
        'appId'
    ];

    const result = {
        headers
    };

    if (options !== null && typeof options === 'object') {
        SEND_OR_PUBLISH_OPTION_KEYS.forEach((whitelistedOption) => {
            if (options.hasOwnProperty(whitelistedOption) && options[whitelistedOption] !== null) {
                result[whitelistedOption] = options[whitelistedOption];
            }
        });
    }

    return result;
};

module.exports = buildPublishOrSendOptions;
