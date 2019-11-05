<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [bunnybus](#bunnybus)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Async / Await](#async--await)
    - [With Callbacks](#with-callbacks)
  - [Documentation](#documentation)
    - [API](#api)
    - [Examples](#examples)
    - [Diagrams](#diagrams)
  - [Articles](#articles)
  - [Contributing](#contributing)
  - [Setting up for development](#setting-up-for-development)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# bunnybus
BunnyBus is a high level enterprise bus implementation making pub/sub and queue management easy. 

Currently supports the following queueing frameworks.

- [RabbitMQ](https://www.rabbitmq.com/)

[![Build Status](https://travis-ci.com/tenna-llc/bunnybus.svg?branch=master)](https://travis-ci.com/tenna-llc/bunnybus)

Lead Maintainer: [Lam Chan](https://github.com/lamchakchan)

## Introduction
BunnyBus abstracts away low level queue driver details such as creating a connection, creating a channel, creating bindings, creating subscribing queues and etc.  BunnyBus provides safe defaults for many setups which can also be configured.  The core of BunnyBus implements native node callbacks providing maximum performance.  BunnyBus provides two flavors of API for callbacks and Promise alike.  The BunnyBus CLI can be found [here](https://github.com/xogroup/bunnybus-cli) implementing this core driver.

## Installation
```
npm i bunnybus
```

## Usage

### Async / Await
```javascript
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
```javascript
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
