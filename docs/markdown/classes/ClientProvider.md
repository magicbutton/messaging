[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: ClientProvider

Registry for client factories providing centralized dependency injection

The provider pattern centralizes factory registration and client creation,
allowing components to request clients by type without knowing implementation details.

## Constructors

### Constructor

> **new ClientProvider**(): `ClientProvider`

#### Returns

`ClientProvider`

## Methods

### clearFactories()

> `static` **clearFactories**(): `void`

Clear all registered factories from the registry

This is primarily useful for testing to ensure a clean state
between test cases or when reconfiguring the system.

#### Returns

`void`

***

### createClient()

> `static` **createClient**\<`TContract`\>(`type`, `config`): [`MessagingClient`](MessagingClient.md)\<`TContract`\>

Create a client instance using the appropriate factory

This method handles the factory lookup and delegates client creation
to the registered factory, ensuring proper dependency injection.

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The client type identifier to use for factory lookup

##### config

[`ClientConfig`](../interfaces/ClientConfig.md)\<`TContract`\>

The client configuration to pass to the factory

#### Returns

[`MessagingClient`](MessagingClient.md)\<`TContract`\>

A configured client instance of the specified type

#### Throws

Error if no factory is registered for the specified type

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if a client factory type is registered

#### Parameters

##### type

`string`

The client type to check

#### Returns

`boolean`

True if a factory is registered for the type

***

### registerFactory()

> `static` **registerFactory**\<`TContract`\>(`type`, `factory`): `void`

Register a client factory in the provider registry

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The client type identifier for lookup

##### factory

[`ClientFactory`](../interfaces/ClientFactory.md)\<`TContract`\>

The factory implementation to register

#### Returns

`void`
