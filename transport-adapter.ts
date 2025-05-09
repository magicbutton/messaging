import type { TransportAdapter } from "./types"

/**
 * Create a transport adapter
 * @param transport The transport implementation
 * @returns The transport adapter
 */
export function createTransportAdapter<TEvents extends Record<string, any>, TRequests extends Record<string, any>>(
  transport: TransportAdapter<TEvents, TRequests>,
): TransportAdapter<TEvents, TRequests> {
  return transport
}
