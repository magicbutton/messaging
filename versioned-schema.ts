import * as z from "zod"
import type { EventSchemas, RequestSchemas } from "./types"

/**
 * Interface for schema version information
 */
export interface SchemaVersion {
  major: number
  minor: number
  patch: number
}

/**
 * Interface for versioned schema
 */
export interface VersionedSchema<T extends z.ZodType> {
  schema: T
  version: SchemaVersion
  deprecated?: boolean
  successor?: VersionedSchema<T>
  predecessor?: VersionedSchema<T>
}

/**
 * Interface for versioned event schemas
 */
export type VersionedEventSchemas = {
  [key: string]: VersionedSchema<z.ZodType>[]
}

/**
 * Interface for versioned request schemas
 */
export type VersionedRequestSchemas = {
  [key: string]: {
    requestSchemas: VersionedSchema<z.ZodType>[]
    responseSchemas: VersionedSchema<z.ZodType>[]
  }
}

/**
 * Create a versioned schema
 * @param schema The Zod schema
 * @param version The schema version
 * @param options Additional options
 * @returns The versioned schema
 */
export function createVersionedSchema<T extends z.ZodType>(
  schema: T,
  version: SchemaVersion,
  options: { deprecated?: boolean } = {}
): VersionedSchema<T> {
  return {
    schema,
    version,
    deprecated: options.deprecated,
  }
}

/**
 * Link two schema versions as predecessor and successor
 * @param predecessor The predecessor schema
 * @param successor The successor schema
 */
export function linkSchemaVersions<T extends z.ZodType>(
  predecessor: VersionedSchema<T>,
  successor: VersionedSchema<T>
): void {
  predecessor.successor = successor
  successor.predecessor = predecessor
}

/**
 * Create a versioned event map
 * @param schemas The versioned event schemas
 * @returns The versioned event map
 */
export function createVersionedEventMap<T extends VersionedEventSchemas>(
  schemas: T
): T {
  return schemas
}

/**
 * Create a versioned request schema map
 * @param schemas The versioned request schemas
 * @returns The versioned request schema map
 */
export function createVersionedRequestSchemaMap<T extends VersionedRequestSchemas>(
  schemas: T
): T {
  return schemas
}

/**
 * Get the latest version of a schema
 * @param schemas Array of versioned schemas
 * @returns The latest non-deprecated schema
 */
export function getLatestSchema<T extends z.ZodType>(
  schemas: VersionedSchema<T>[]
): VersionedSchema<T> | undefined {
  // Sort by semantic version (major, minor, patch)
  const sortedSchemas = [...schemas].sort((a, b) => {
    if (a.version.major !== b.version.major) {
      return b.version.major - a.version.major
    }
    if (a.version.minor !== b.version.minor) {
      return b.version.minor - a.version.minor
    }
    return b.version.patch - a.version.patch
  })

  // Return the first non-deprecated schema
  return sortedSchemas.find(schema => !schema.deprecated) || sortedSchemas[0]
}

/**
 * Get a specific version of a schema
 * @param schemas Array of versioned schemas
 * @param version The version to find
 * @returns The matching schema or undefined
 */
export function getSchemaByVersion<T extends z.ZodType>(
  schemas: VersionedSchema<T>[],
  version: SchemaVersion
): VersionedSchema<T> | undefined {
  return schemas.find(
    schema => 
      schema.version.major === version.major &&
      schema.version.minor === version.minor &&
      schema.version.patch === version.patch
  )
}

/**
 * Convert versioned event schemas to standard event schemas (using latest versions)
 * @param versionedSchemas The versioned event schemas
 * @returns Standard event schemas
 */
export function toEventSchemas(versionedSchemas: VersionedEventSchemas): EventSchemas {
  const result: EventSchemas = {}
  
  for (const [key, schemas] of Object.entries(versionedSchemas)) {
    const latestSchema = getLatestSchema(schemas)
    if (latestSchema) {
      result[key] = latestSchema.schema
    }
  }
  
  return result
}

/**
 * Convert versioned request schemas to standard request schemas (using latest versions)
 * @param versionedSchemas The versioned request schemas
 * @returns Standard request schemas
 */
export function toRequestSchemas(versionedSchemas: VersionedRequestSchemas): RequestSchemas {
  const result: RequestSchemas = {}
  
  for (const [key, { requestSchemas, responseSchemas }] of Object.entries(versionedSchemas)) {
    const latestRequestSchema = getLatestSchema(requestSchemas)
    const latestResponseSchema = getLatestSchema(responseSchemas)
    
    if (latestRequestSchema && latestResponseSchema) {
      result[key] = {
        requestSchema: latestRequestSchema.schema,
        responseSchema: latestResponseSchema.schema
      }
    }
  }
  
  return result
}

/**
 * Create a versioned contract
 * @param events The versioned event schemas
 * @param requests The versioned request schemas
 * @returns The versioned contract
 */
export function createVersionedContract<
  TEvents extends VersionedEventSchemas,
  TRequests extends VersionedRequestSchemas
>(contract: {
  events: TEvents
  requests: TRequests
}): {
  events: TEvents
  requests: TRequests
  toStandard: () => {
    events: EventSchemas
    requests: RequestSchemas
  }
} {
  return {
    events: contract.events,
    requests: contract.requests,
    toStandard: () => ({
      events: toEventSchemas(contract.events),
      requests: toRequestSchemas(contract.requests)
    })
  }
}