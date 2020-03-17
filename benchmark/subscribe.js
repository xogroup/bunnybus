'use strict';

const BunnyBus = require('../lib');

const instance = new BunnyBus();
const connectionManager = instance.connections;
const channelManager = instance.channels;
let channelContext = undefined;

const baseChannelName = 'bunnybus-subscribe-bench';
const baseQueueName = 'bench-subscribe-queue';
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
    for (let i = 0; i < messageCount; ++i) {
        await instance.publish(message, options);
        if ( i % 1000 === 0 ) {
            console.log(`Published ${i}/${messageCount}`);
        }
    }

    console.log('\n\n All messages published, beginning subscribe...\n\n');

    let messagesReceived = 0;
    const start = process.hrtime.bigint();
    await instance.subscribe('queue1', { 
        'bench-a' : async (message, ack) => {

            messagesReceived++;
            await ack();
            const tat = process.hrtime.bigint();
            const time = tat - start;
            if ( messagesReceived % 1000 === 0 ) {
                console.log(`${messagesReceived}/${messageCount} | ${time}ns | ${time / BigInt(1000000000)}secs`);
            }

            if ( messagesReceived >= messageCount ) {
                await after();
                console.log(`BENCHMARK\n\n\nPublish\n${time}ns\n${time / BigInt(1000000000)}secs\n`);
                process.exit(0);
            }
        }}
    );
};

run();
