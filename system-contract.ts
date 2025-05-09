import * as z from "zod"
import { createRequestSchemaMap, createEventMap } from "./utils"

/**
 * System-level events prefixed with '$'
 * These events are used for system-level communication between clients and servers
 */
export const systemEvents = createEventMap({
  // Client connected to server
  $connected: z.object({
    clientId: z.string(),
    connectionId: z.string(),
    timestamp: z.number(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),

  // Client disconnected from server
  $disconnected: z.object({
    clientId: z.string(),
    connectionId: z.string(),
    reason: z.string().optional(),
    timestamp: z.number(),
  }),

  // Server broadcast to all clients
  $broadcast: z.object({
    message: z.string(),
    data: z.unknown().optional(),
    timestamp: z.number(),
  }),

  // Heartbeat to keep connection alive
  $heartbeat: z.object({
    timestamp: z.number(),
    clientId: z.string().optional(),
    serverId: z.string().optional(),
  }),

  // Error occurred at system level
  $error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    timestamp: z.number(),
  }),
})

/**
 * System-level requests prefixed with '$'
 * These requests are used for system-level operations between clients and servers
 */
export const systemRequests = createRequestSchemaMap({
  // Register a client with the server
  $register: {
    requestSchema: z.object({
      clientId: z.string(),
      clientType: z.string(),
      capabilities: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      connectionId: z.string(),
      serverId: z.string(),
      serverTime: z.number(),
      ttl: z.number().optional(), // Time to live in seconds
    }),
  },

  // Unregister a client from the server
  $unregister: {
    requestSchema: z.object({
      clientId: z.string(),
      connectionId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      timestamp: z.number(),
    }),
  },

  // Ping the server to check connectivity
  $ping: {
    requestSchema: z.object({
      timestamp: z.number(),
      payload: z.string().optional(),
    }),
    responseSchema: z.object({
      timestamp: z.number(),
      serverTime: z.number(),
      echo: z.string().optional(),
    }),
  },

  // Get server information
  $serverInfo: {
    requestSchema: z.object({}),
    responseSchema: z.object({
      serverId: z.string(),
      version: z.string(),
      uptime: z.number(),
      connectedClients: z.number(),
      capabilities: z.array(z.string()),
      serverTime: z.number(),
    }),
  },

  // Subscribe to specific events
  $subscribe: {
    requestSchema: z.object({
      clientId: z.string(),
      events: z.array(z.string()),
      filter: z.record(z.string(), z.unknown()).optional(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      subscriptionId: z.string(),
      events: z.array(z.string()),
    }),
  },

  // Unsubscribe from specific events
  $unsubscribe: {
    requestSchema: z.object({
      clientId: z.string(),
      subscriptionId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
    }),
  },
})

/**
 * System contract type that combines system events and requests
 */
export type SystemContract = {
  events: typeof systemEvents
  requests: typeof systemRequests
}

/**
 * Create a system contract instance
 */
export const createSystemContract = (): SystemContract => {
  return {
    events: systemEvents,
    requests: systemRequests,
  }
}
