[**Magic Button Messaging v1.1.2**](../README.md)

***

# Interface: AuthorizationProviderFactory\<TContract\>

Authorization provider factory interface for creating authorization providers

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Methods

### createAuthorizationProvider()

> **createAuthorizationProvider**(`config`): [`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

Create an authorization provider instance

#### Parameters

##### config

[`AuthorizationProviderConfig`](AuthorizationProviderConfig.md)\<`TContract`\>

The authorization provider configuration

#### Returns

[`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>
