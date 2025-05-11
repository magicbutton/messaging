[**Magic Button Messaging v1.1.2**](../README.md)

***

# Interface: ConfigurationSource

Configuration source interface for loading settings

The configuration source pattern allows loading configuration
from different locations (files, environment, memory) with a
consistent interface, enabling flexible configuration strategies.

## Methods

### getName()

> **getName**(): `string`

Get the source's name for identification and debugging

#### Returns

`string`

The source identifier name

***

### load()

> **load**(): `Promise`\<`Record`\<`string`, `any`\>\>

Load configuration data from this source

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

Promise resolving to the configuration object
