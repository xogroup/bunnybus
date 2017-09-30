# bunnybus
BunnyBus is a high level enterprise bus implementation making pub/sub and queue management easy. 

Currently supports the following queueing frameworks.

- [RabbitMQ](https://www.rabbitmq.com/)

[![npm version](https://badge.fury.io/js/bunnybus.svg)](https://badge.fury.io/js/bunnybus)
[![Build Status](https://travis-ci.org/xogroup/bunnybus.svg?branch=development)](https://travis-ci.org/xogroup/bunnybus)
[![Known Vulnerabilities](https://snyk.io/test/github/xogroup/bunnybus/badge.svg)](https://snyk.io/test/github/xogroup/bunnybus)
[![NSP Status](https://nodesecurity.io/orgs/xo-group/projects/599e335d-8668-4f77-89ea-ebac0d607378/badge)](https://nodesecurity.io/orgs/xo-group/projects/599e335d-8668-4f77-89ea-ebac0d607378)

Lead Maintainer: [Lam Chan](https://github.com/lamchakchan)

## Introduction
BunnyBus abstracts away low level queue driver details such as creating a connection, creating a channel, creating bindings, creating subscribing queues and etc.  BunnyBus provides safe defaults for many setups which can also be configured.  The core of BunnyBus implements native node callbacks providing maximum performance.  BunnyBus provides two flavors of API for callbacks and Promise alike.  The BunnyBus CLI can be found [here](https://github.com/xogroup/bunnybus-cli) implementing this core driver.

## Installation
```
npm i bunnybus
```

## Usage

### Async / Await
```
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

//create a subscription
await bunnyBus.subscribe('queue1', { 
    'create-event' : (message, ack) => {
        console.log(message.comment);
        ack();
    }});


//publish to the above subscription
bunnyBus.publish({ event : 'create-event', comment : 'hello world!' });

);
```

### With Callbacks
```
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

//create a subscription
bunnyBus.subscribe('queue1', { 
    'create-event' : (message, ack) => {
        console.log(message.comment);
        ack();
    }}, () => {

    //publish to the above subscription
    bunnyBus.publish({ event : 'create-event', comment : 'hello world!' });
    }
);
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
