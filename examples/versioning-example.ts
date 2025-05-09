import * as z from "zod"
import { 
  createVersionedSchema, 
  createVersionedEventMap, 
  createVersionedRequestSchemaMap,
  linkSchemaVersions,
  getLatestSchema,
  createVersionedContract,
  toEventSchemas,
  toRequestSchemas
} from "../versioned-schema"

// Example: Create versioned user events
const userCreatedV1 = createVersionedSchema(
  z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
  }),
  { major: 1, minor: 0, patch: 0 }
)

// Version 2 adds more fields
const userCreatedV2 = createVersionedSchema(
  z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    createdAt: z.number()
  }),
  { major: 2, minor: 0, patch: 0 }
)

// Link versions to establish relationships
linkSchemaVersions(userCreatedV1, userCreatedV2)

// Example: Create versioned user request/response
const getUserRequestV1 = createVersionedSchema(
  z.object({
    userId: z.string()
  }),
  { major: 1, minor: 0, patch: 0 }
)

const getUserResponseV1 = createVersionedSchema(
  z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email()
  }),
  { major: 1, minor: 0, patch: 0 }
)

// Version 2 of response includes more fields
const getUserResponseV2 = createVersionedSchema(
  z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roles: z.array(z.string()).default([]),
    createdAt: z.number(),
    updatedAt: z.number().optional()
  }),
  { major: 2, minor: 0, patch: 0 }
)

// Create versioned schemas collections
const versionedEvents = createVersionedEventMap({
  "user.created": [userCreatedV1, userCreatedV2],
  "user.updated": [
    createVersionedSchema(
      z.object({
        id: z.string(),
        changes: z.record(z.string(), z.unknown())
      }),
      { major: 1, minor: 0, patch: 0 }
    )
  ]
})

const versionedRequests = createVersionedRequestSchemaMap({
  "getUser": {
    requestSchemas: [getUserRequestV1],
    responseSchemas: [getUserResponseV1, getUserResponseV2]
  }
})

// Create a versioned contract
const userServiceContract = createVersionedContract({
  events: versionedEvents,
  requests: versionedRequests
})

// Convert to standard contract for use with non-versioned parts of the system
const standardContract = userServiceContract.toStandard()

// Usage example
function demonstrateVersionedSchema() {
  // Get the latest schema for the user.created event
  const latestUserCreatedSchema = getLatestSchema(versionedEvents["user.created"])
  
  if (latestUserCreatedSchema) {
    console.log(
      `Latest user.created schema version: ${latestUserCreatedSchema.version.major}.${latestUserCreatedSchema.version.minor}.${latestUserCreatedSchema.version.patch}`
    )
  }
  
  // Validate against the latest schema
  const userData = {
    id: "123",
    username: "johndoe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    createdAt: Date.now()
  }
  
  // This will validate against V2 schema (if it's the latest)
  if (latestUserCreatedSchema) {
    const validationResult = latestUserCreatedSchema.schema.safeParse(userData)
    console.log("Validation result:", validationResult.success)
  }
  
  // Use the standard contract with existing system components
  const events = standardContract.events
  const requests = standardContract.requests
  
  console.log("Standard events:", Object.keys(events))
  console.log("Standard requests:", Object.keys(requests))
}

demonstrateVersionedSchema()