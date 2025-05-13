[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: IMessageContext

Context information for messages

## Extends

- `TypeOf`\<*typeof* `MessageContextSchema`\>

## Properties

### auth?

> `optional` **auth**: `object`

#### actor?

> `optional` **actor**: `object`

##### actor.id

> **id**: `string`

##### actor.metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

##### actor.permissions?

> `optional` **permissions**: `string`[]

##### actor.roles?

> `optional` **roles**: `string`[]

##### actor.type

> **type**: `string`

#### token?

> `optional` **token**: `string`

#### Inherited from

`z.infer.auth`

***

### id?

> `optional` **id**: `string`

#### Inherited from

`z.infer.id`

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

#### Inherited from

`z.infer.metadata`

***

### parentSpanId?

> `optional` **parentSpanId**: `string`

#### Inherited from

`z.infer.parentSpanId`

***

### source?

> `optional` **source**: `string`

#### Inherited from

`z.infer.source`

***

### spanId?

> `optional` **spanId**: `string`

#### Inherited from

`z.infer.spanId`

***

### target?

> `optional` **target**: `string`

#### Inherited from

`z.infer.target`

***

### timestamp?

> `optional` **timestamp**: `number`

#### Inherited from

`z.infer.timestamp`

***

### traceId?

> `optional` **traceId**: `string`

#### Inherited from

`z.infer.traceId`
