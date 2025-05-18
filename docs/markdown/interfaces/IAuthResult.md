[**Magic Button Messaging v1.2.0**](../README.md)

***

# Interface: IAuthResult

Authentication result interface

## Extends

- `TypeOf`\<*typeof* `AuthResultSchema`\>

## Properties

### error?

> `optional` **error**: `object`

#### code

> **code**: `string`

#### message

> **message**: `string`

#### Inherited from

`z.infer.error`

***

### expiresAt?

> `optional` **expiresAt**: `number`

#### Inherited from

`z.infer.expiresAt`

***

### success

> **success**: `boolean`

#### Inherited from

`z.infer.success`

***

### token?

> `optional` **token**: `string`

#### Inherited from

`z.infer.token`

***

### user?

> `optional` **user**: `objectOutputType`\<\{ `id`: `ZodString`; `roles`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `username`: `ZodString`; \}, `ZodAny`, `"strip"`\>

#### Inherited from

`z.infer.user`
