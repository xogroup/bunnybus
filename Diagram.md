# Diagrams

Examples are based on usage of Promises.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [BunnyBus Layout](#bunnybus-layout)
  - [Components of the Diagram](#components-of-the-diagram)
    - [Modules](#modules)
- [Possible Service Container Setup](#possible-service-container-setup)
  - [Components of the Diagram](#components-of-the-diagram-1)
    - [Plugins](#plugins)
    - [External application](#external-application)
- [Bus Strategies](#bus-strategies)
  - [Components of the Diagram](#components-of-the-diagram-2)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
## BunnyBus Layout

At the core of BunnyBus exists the `amqplib` abstraction to help with connection management, exchange creation, queue creation and route key subscriptions.  BunnyBus also contains other subcomponents which it relies on to handle queue subscriptions when handlers are registered and also to log with when a logging request is made.

![Image of Bunny Components](/image/components.png)

The above diagram shows the relationship between BunnyBus Core with the supporting sub modules.

### Components of the Diagram

#### Modules

* BunnyBus Core - Extends the `EventEmitter` to help with eventing internal processed commands or errors needed to propagate up to the client.  The sole responsibilty is to provide an easier to use contract with RabbitMQ.
* EventLogger - This is exposed through the `logger` setter/getter property.  Different implementation of `logger` can be provided.  The built in `EventLogger` marries the `EventEmitter` from BunnyBus Core to it.  As an example, when internally `log.info` is called, BunnyBus will emit the `log.info` event.  When the logger is replaced, the event emitting behavior is removed.
* SubscriptionManager - Extends the `EventEmitter`.  The Subscription Manager's sole responsibility is to relay bridge real state with desired state and vice versa.  When BunnyBus recieves a `subscribe()` command, the Subscription Manager is used to register those subscriptions.  When the client wants to `block()` subscriptions, that is done through this component and relayed to BunnyBus via events to realize the desired state.


## Possible Service Container Setup

BunnyBus is nothing without an ecosystem to support it.  While it is easy to setup a pub/sub mechanism, there are supporting controls and monitoring which enhances
the experience of operational maintenance of an Enterprise Service Bus (ESB).  What is provided here is an example of an application setup to facilitate with 
production level management.

![Image of Possible Usage](/image/possible-usage.png)

The above diagram is based on `hapijs` as the service container.  `hapijs` allows for a plugin architecture and provides for configuration over convention setup philosophy.

### Components of the Diagram

#### Plugins

* hapi-mail-sender - Subcribes to messages that are created and sends emails as an artifact of that event.  Could also publish out an event with some verification token that the message was sent so down stream subscribers can set some sort of `SENT` state in their read views.
* hapi-topology-logger - Interacts with BunnyBus to get the runtime configuration for the BunnyBus instance.  Transforms this data into Neo4J edges and nodes to build up the relationship for the graph of the overall bus.  This can be a powerful component when all of the services can map itself to a shared data store.
* hapi-queue-switch - Interacts with BunnyBus to toggle a consumer on and off.  There might be times when it is necessary to pause queue processing activities.  This is especially useful when there are more than one of these service containers listening to the same queue (for process scaling) and the need to control them all at once.  The plugin can poll a shared database for desired states and when the target matches one that this plugin knows about, it can try to meet the existing state with desired state by calling upon the `SubscriptionManager` interface of BunnyBus.

#### External application

* hapi-queue-controller - This component is an endpoint that allows for a user to toggle a queue's desired state using a shared database.
* SendMail - Transactional email provider.

## Bus Strategies

The topography of an ESB is important, and it is what enables you to connect many services together, especially in a microservice landscape.

![Image of Bus Strategy](/image/bus-strategy.png)

Not all subscriptions are equal.  Some subscriptions require queues to be persistent while others would queues to live as long as the consumer is alive.  Strategies around short-lived queues are useful for realtime data consumers for things like websocket edge services.

### Components of the Diagram

* process stable - A service that needs to maintain a persistent long lived queue.  When the process goes down or is restarted, the queue retains messages and serves where it last left off.
* process {hash} - Services that only want queues to be maintained as long it the process itself is alive.  This special behavior can be set in the `subscribe()` call within the `options.queue` property.
* process api - The feeder for all messages the above subscribers are listening to.