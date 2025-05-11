import { Contract } from "./types";
import { InMemoryTransport } from "./in-memory-transport";
import { TransportFactory, TransportConfig } from "./transport-factory";

/**
 * In-memory transport factory for creating in-memory transports
 */
export class InMemoryTransportFactory<TContract extends Contract> implements TransportFactory<TContract> {
  /**
   * Create an in-memory transport instance
   * @param config The transport configuration
   */
  createTransport(config: TransportConfig): InMemoryTransport<TContract> {
    // Create a new in-memory transport with typed contract
    const transport = new InMemoryTransport<TContract>();
    
    // Auto-connect if connectionString is provided
    if (config.connectionString) {
      transport.connect(config.connectionString).catch(error => {
        console.error("Failed to auto-connect in-memory transport:", error);
      });
    }
    
    return transport;
  }
}