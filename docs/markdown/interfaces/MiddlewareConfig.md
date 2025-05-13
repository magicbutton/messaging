[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: MiddlewareConfig

Configuration for middleware factory system

This configuration structure enables declarative middleware setup
through the factory pattern, allowing middleware to be configured
without direct component references.

## Properties

### options?

> `optional` **options**: `object`

Middleware configuration options

#### Index Signature

\[`key`: `string`\]: `any`

Additional custom configuration options

#### authentication?

> `optional` **authentication**: `object`

Authentication middleware configuration

##### authentication.authFn()?

> `optional` **authFn**: (`context`) => `boolean` \| `Promise`\<`boolean`\>

Custom authentication function

###### Parameters

###### context

[`IMessageContext`](IMessageContext.md)

###### Returns

`boolean` \| `Promise`\<`boolean`\>

##### authentication.enabled

> **enabled**: `boolean`

Enable/disable authentication middleware

##### authentication.excludedRequests?

> `optional` **excludedRequests**: `string`[]

Request types excluded from authentication

#### custom?

> `optional` **custom**: `object`

Custom middleware configuration

##### custom.eventMiddlewares?

> `optional` **eventMiddlewares**: `object`[]

Event middleware configurations

##### custom.requestMiddlewares?

> `optional` **requestMiddlewares**: `object`[]

Request middleware configurations

#### logging?

> `optional` **logging**: `boolean`

Enable/disable logging middleware
Default: true

#### validation?

> `optional` **validation**: `boolean`

Enable/disable schema validation middleware
Default: true

***

### type

> **type**: `string`

The middleware factory type to use
