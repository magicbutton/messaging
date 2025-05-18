/**
 * Constants for the messaging library
 * This file is automatically updated by the version bumping script
 */

// Library version - DO NOT MODIFY MANUALLY
// This is automatically updated by the version bumping script
export const VERSION = '1.2.0';

// Library information
export const LIBRARY_NAME = '@magicbutton.cloud/messaging';
export const LIBRARY_DESCRIPTION = 'Type-safe, contract-first messaging framework for distributed systems';

// Feature flags
export const FEATURES = {
  CONTRACT_VALIDATION: true,
  CONNECTION_MANAGEMENT: true,
  TELEMETRY: true,
  ACCESS_CONTROL: true,
  RETRY_MECHANISM: true
};

// Version compatibility information
export const COMPATIBILITY = {
  // Minimum compatible version
  MIN_COMPATIBLE_VERSION: '0.1.0',
  // Recommended version (usually the current version)
  RECOMMENDED_VERSION: VERSION,
  // Versions below this are considered deprecated
  DEPRECATED_BELOW: null
};

// Default configuration values
export const DEFAULT_CONFIG = {
  // Default timeout for requests in milliseconds
  REQUEST_TIMEOUT_MS: 30000,
  // Default interval for heartbeat messages in milliseconds
  HEARTBEAT_INTERVAL_MS: 30000,
  // Default maximum number of retry attempts
  MAX_RETRY_ATTEMPTS: 3,
  // Default initial delay for retry backoff in milliseconds
  RETRY_INITIAL_DELAY_MS: 1000,
  // Default multiplier for retry backoff
  RETRY_BACKOFF_FACTOR: 1.5
};