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
BunnyBus abstracts away low level queue driver details such as creating a connection, creating a channel, creating bindings, creating subscribing queues and etc.  BunnyBus provides safe defaults for many setups which can also be configured.  The core of BunnyBus implements native node callbacks providing maximum performance.  BunnyBus provides two flavors of API for callbacks and Promise alike.

## Installation
```
npm install bunnybus
```

## Usage

### API

See the [API Reference](http://github.com/xogroup/bunnybus/blob/master/API.md).

### Examples

Check out the [Examples](http://github.com/xogroup/bunnybus/blob/master/Example.md).

### Diagrams

[Visual Guide](http://github.com/xogroup/bunnybus/blob/master/Diagram.md) to integrating with `BunnyBus`.

## Contributing

We love community and contributions! Please check out our [guidelines](http://github.com/xogroup/bunnybus/blob/master/.github/CONTRIBUTING.md) before making any PRs.

## Setting up for development

Getting yourself setup and bootstrapped is easy.  Use the following commands after you clone down.

```
npm install
npm run start-docker
npm test
npm run stop-docker
```

For normal iterations, there is no need to stop the docker container.  When the docker container is already running, just `npm test`.
