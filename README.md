# bunnybus
BunnyBus is a high level enterprise bus implementation making pub/sub and queue management easy. 

Currently supports the following queueing frameworks.

- [RabbitMQ](https://www.rabbitmq.com/)

[![npm version](https://badge.fury.io/js/bunnybus.svg)](https://badge.fury.io/js/bunnybus)
[![Build Status](https://travis-ci.org/xogroup/bunnybus.svg?branch=master)](https://travis-ci.org/xogroup/bunnybus)

[![Known Vulnerabilities](https://snyk.io/test/github/xogroup/bunnybus/badge.svg)](https://snyk.io/test/github/xogroup/bunnybus)
[![NSP Status](https://nodesecurity.io/orgs/xo-group/projects/0e507cfa-6ee8-4226-9613-9a4208fa2e63/badge)](https://nodesecurity.io/orgs/xo-group/projects/0e507cfa-6ee8-4226-9613-9a4208fa2e63)

Lead Maintainer: [Lam Chan](https://github.com/lamchakchan)

## Introduction
BunnyBus abstracts away low level queue driver details such as creating a connection, creating a channel, creating bindings, creating subscribing queues and etc.  
BunnyBus provides safe defaults for many setups which can also be configured.  The core of BunnyBus implements native node callbacks providing maximum performance.  
BunnyBus provides two flavors of API for callbacks and Promise alike.

## Installation
```
npm install bunnybus
```

## Usage

## API

See the [API Reference](http://github.com/xogroup/bunnybus/blob/master/API.md).

## Contributing

We love community and contributions! Please check out our [guidelines](http://github.com/xogroup/bunnybus/blob/master/.github/CONTRIBUTING.md) before making any PRs.

## Setting up for development

Getting yourself setup and bootstrapped is easy.  Use the following commands after you clone down.

```
npm install && npm test
```