import { Contract } from './types';
import { Transport } from './transport-adapter';

/**
 * Interface for platform-specific extensions that can be added to transports.
 * This allows for specialized functionality in different environments.
 */
export interface TransportExtensions {
  /**
   * Gets the list of available extension names
   * @returns Array of extension names
   */
  getExtensionNames(): string[];
  
  /**
   * Checks if a specific extension is supported
   * @param name Name of the extension to check
   * @returns True if the extension is supported
   */
  hasExtension(name: string): boolean;
  
  /**
   * Gets an extension by name
   * @param name Name of the extension to get
   * @returns The extension function or undefined if not found
   */
  getExtension<T = unknown>(name: string): T | undefined;
  
  /**
   * Adds an extension to the transport
   * @param name Name of the extension
   * @param implementation Extension implementation
   */
  addExtension<T>(name: string, implementation: T): void;
}

/**
 * Platform-specific extensions for browser environments
 */
export interface BrowserExtensions {
  /**
   * Opens a side panel in browser extensions
   */
  openSidePanel?(): Promise<void>;
  
  /**
   * Closes a side panel in browser extensions
   */
  closeSidePanel?(): Promise<void>;
  
  /**
   * Navigates the current tab to a URL
   * @param url The URL to navigate to
   * @param tabId Optional tab ID (defaults to current tab)
   */
  navigateTab?(url: string, tabId?: number): Promise<void>;
  
  /**
   * Captures a screenshot of the current tab
   * @param options Screenshot options
   */
  captureScreenshot?(options?: { fullPage?: boolean }): Promise<string>;
  
  /**
   * Gets information about the current tab
   */
  getCurrentTabInfo?(): Promise<{ tabId: number; url: string; title?: string }>;
  
  /**
   * Index signature for dynamic extensions
   */
  [key: string]: any;
}

/**
 * Platform-specific extensions for CLI environments
 */
export interface CliExtensions {
  /**
   * Shows a spinner with a message
   * @param message Message to display
   */
  showSpinner?(message: string): void;
  
  /**
   * Hides the spinner
   */
  hideSpinner?(): void;
  
  /**
   * Displays a progress bar
   * @param percent Percentage complete (0-100)
   * @param message Optional message
   */
  showProgress?(percent: number, message?: string): void;
  
  /**
   * Index signature for dynamic extensions
   */
  [key: string]: any;
}

/**
 * Platform-specific extensions for server environments
 */
export interface ServerExtensions {
  /**
   * Gets server metrics
   */
  getMetrics?(): Promise<Record<string, number>>;
  
  /**
   * Gets server health information
   */
  getHealth?(): Promise<{ status: string; checks: Record<string, boolean> }>;
  
  /**
   * Index signature for dynamic extensions
   */
  [key: string]: any;
}

/**
 * Extension-aware transport interface that combines core transport with extensions
 */
export interface ExtensibleTransport<TContract extends Contract> extends Transport<TContract>, TransportExtensions {
  /**
   * Browser-specific extensions
   */
  browser: BrowserExtensions;
  
  /**
   * CLI-specific extensions
   */
  cli: CliExtensions;
  
  /**
   * Server-specific extensions
   */
  server: ServerExtensions;
}

/**
 * Base implementation of the TransportExtensions interface
 */
export class BaseTransportExtensions implements TransportExtensions {
  private extensions: Record<string, unknown> = {};
  
  /**
   * Gets the list of available extension names
   * @returns Array of extension names
   */
  getExtensionNames(): string[] {
    return Object.keys(this.extensions);
  }
  
  /**
   * Checks if a specific extension is supported
   * @param name Name of the extension to check
   * @returns True if the extension is supported
   */
  hasExtension(name: string): boolean {
    return name in this.extensions;
  }
  
  /**
   * Gets an extension by name
   * @param name Name of the extension to get
   * @returns The extension function or undefined if not found
   */
  getExtension<T = unknown>(name: string): T | undefined {
    return this.extensions[name] as T | undefined;
  }
  
  /**
   * Adds an extension to the transport
   * @param name Name of the extension
   * @param implementation Extension implementation
   */
  addExtension<T>(name: string, implementation: T): void {
    this.extensions[name] = implementation;
  }
  
  /**
   * Browser-specific extensions
   */
  readonly browser: BrowserExtensions = {};
  
  /**
   * CLI-specific extensions
   */
  readonly cli: CliExtensions = {};
  
  /**
   * Server-specific extensions
   */
  readonly server: ServerExtensions = {};
}