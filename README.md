# bunnybus
BunnyBus is a high level enterprise bus implementation making pub/sub and queue management easy. 

Currently supports the following queueing frameworks.

- [RabbitMQ](https://www.rabbitmq.com/)

[![npm version](https://badge.fury.io/js/bunnybus.svg)](https://badge.fury.io/js/bunnybus)
[![Build Status](https://travis-ci.org/xogroup/bunnybus.svg?branch=development)](https://travis-ci.org/xogroup/bunnybus)
[![Known Vulnerabilities](https://snyk.io/test/github/xogroup/bunnybus/badge.svg)](https://snyk.io/test/github/xogroup/bunnybus)


Maintainer: [XO Group](https://github.com/xogroup)

## Introduction
BunnyBus abstracts away low level queue driver details such as creating a connection, creating a channel, creating bindings, creating subscribing queues and etc.  BunnyBus provides safe defaults for many setups which can also be configured.

BunnyBus supports async/await and promises for the modern javascript developer.


## Installation
```
npm i bunnybus
```

## Usage
```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

//create a subscription
await bunnyBus.subscribe('queue1', { 
    'create-event' : async (message, ack) => {
        console.log(message.comment);
        await ack();
    }});


//publish to the above subscription
await bunnyBus.publish({ event : 'create-event', comment : 'hello world!' });
```

## Documentation

### API

See the [API Reference](http://github.com/xogroup/bunnybus/blob/master/API.md).

### Examples

Check out the [Examples](http://github.com/xogroup/bunnybus/blob/master/Example.md).

### Diagrams

[Visual Guide](http://github.com/xogroup/bunnybus/blob/master/Diagram.md) to integrating with `BunnyBus`.

## Articles

* [@Medium](https://medium.com/xo-tech/bunnybus-building-a-data-transit-system-b9647f6283e5#.f9ghb6mzl)

## Contributing

We love community and contributions! Please check out our [guidelines](http://github.com/xogroup/bunnybus/blob/master/.github/CONTRIBUTING.md) before making any PRs.

## Setting up for development

1. Install [Docker](https://docs.docker.com/engine/installation/)
2. Clone this project and `cd` into the project directory
3. Run the commands below

```
npm install
npm run start-docker
npm test
npm run stop-docker
```

For normal development/test iterations, there is no need to stop the docker container.  When the docker container is already running, just run `npm test`.
