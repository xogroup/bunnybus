'use strict';

const BunnyBus = require('../lib');

const instance = new BunnyBus();
const connectionManager = instance.connections;
const channelManager = instance.channels;
let channelContext = undefined;

const baseChannelName = 'bunnybus-publish-bench';
const baseQueueName = 'bench-publish-queue';
const message = { name : 'bunnybus' };
const routeKey = 'bench-a';
const messageCount = 100000;

const before = async () => {

    channelContext = await instance._autoBuildChannelContext(baseChannelName);
    await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
    await channelContext.channel.assertExchange(instance.config.globalExchange, 'topic');
    await channelContext.channel.purgeQueue(baseQueueName);
    await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, routeKey);
};

const after = async () => {

    await channelContext.channel.deleteExchange(baseQueueName);
    await channelContext.channel.deleteQueue(baseQueueName);
};

const options = {
    routeKey
};

const run = async () => {

    console.log(`STARTING BENCHMARK\n\n\n`);
    await before();
    const start = process.hrtime.bigint();
    for (let i = 0; i < messageCount; ++i) {

        await instance.publish(message, options);
    }

    const fin = process.hrtime.bigint();
    const time = fin - start;
    await after();
    const summary = `
BENCHMARK
    
    Time to Publish ${messageCount} messages:
        ${time} nanoseconds
        ${time / BigInt(1000000000)} seconds
`

    console.log(summary);
    process.exit(0);
};

run();
