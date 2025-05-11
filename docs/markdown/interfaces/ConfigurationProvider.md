[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: ConfigurationProvider

Configuration provider interface for accessing system settings

This interface defines a standardized way to access configuration values
regardless of their source (environment variables, files, etc.) and
handles hierarchical key structure through dot notation.

## Methods

### get()

> **get**\<`T`\>(`key`, `defaultValue?`): `T`

Get a configuration value by key path

Keys can use dot notation to access nested properties.
For example: "transport.type" would retrieve the "type" property
from the "transport" configuration section.

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

Configuration key path using dot notation

##### defaultValue?

`T`

Value to return if the key doesn't exist

#### Returns

`T`

The configuration value or defaultValue if not found

***

### getAll()

> **getAll**(): `Record`\<`string`, `any`\>

Get all configuration values as a single object

#### Returns

`Record`\<`string`, `any`\>

A deep copy of the entire configuration object

***

### getSection()

> **getSection**(`section`): `Record`\<`string`, `any`\>

Get an entire configuration section

This is useful for retrieving a subset of the configuration
that can be passed to a component factory.

#### Parameters

##### section

`string`

Section name to retrieve

#### Returns

`Record`\<`string`, `any`\>

A deep copy of the section object or an empty object if not found

***

### has()

> **has**(`key`): `boolean`

Check if a configuration key exists

#### Parameters

##### key

`string`

Configuration key path using dot notation

#### Returns

`boolean`

True if the key exists, false otherwise
