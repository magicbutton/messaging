[**Magic Button Messaging v1.1.2**](../README.md)

***

# Interface: Metrics

Metrics interface

## Methods

### gauge()

> **gauge**(`name`, `value`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### histogram()

> **histogram**(`name`, `value`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### increment()

> **increment**(`name`, `value?`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value?

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### timing()

> **timing**(`name`, `value`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`
