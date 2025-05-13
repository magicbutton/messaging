/**
 * Version utilities for the messaging library at runtime
 */

import { VERSION, LIBRARY_NAME, COMPATIBILITY } from './constants';

/**
 * Version information interface
 */
export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  buildMetadata?: string;
}

/**
 * Parse a semantic version string into its components
 * @param version Version string to parse
 * @returns Parsed version information
 */
export function parseVersion(version: string): VersionInfo {
  // Regular expression for semantic versioning
  const semverRegex = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  const match = version.match(semverRegex);
  if (!match) {
    throw new Error(`Invalid version string: ${version}`);
  }
  
  const [, major, minor, patch, prerelease, buildMetadata] = match;
  
  return {
    version,
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
    buildMetadata
  };
}

/**
 * Get the current version of the library
 * @returns Current version string
 */
export function getVersion(): string {
  return VERSION;
}

/**
 * Get detailed information about the current version
 * @returns Parsed version information
 */
export function getVersionInfo(): VersionInfo {
  return parseVersion(VERSION);
}

/**
 * Compare two semantic versions
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns -1 if version1 is less than version2, 0 if they are equal, 1 if version1 is greater
 */
export function compareVersions(version1: string, version2: string): -1 | 0 | 1 {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);
  
  // Compare major version
  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1;
  }
  
  // Compare minor version
  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1;
  }
  
  // Compare patch version
  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1;
  }
  
  // Neither has prerelease, they're equal
  if (!v1.prerelease && !v2.prerelease) {
    return 0;
  }
  
  // One has prerelease, the other doesn't
  if (!v1.prerelease && v2.prerelease) {
    return 1; // Version without prerelease is greater
  }
  if (v1.prerelease && !v2.prerelease) {
    return -1; // Version without prerelease is greater
  }
  
  // Both have prerelease, compare them
  const v1Parts = v1.prerelease!.split('.');
  const v2Parts = v2.prerelease!.split('.');
  
  const minLength = Math.min(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < minLength; i++) {
    const a = v1Parts[i];
    const b = v2Parts[i];
    
    // If both are numeric, compare as numbers
    const aNum = parseInt(a, 10);
    const bNum = parseInt(b, 10);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) {
        return aNum < bNum ? -1 : 1;
      }
    } else {
      // Compare as strings
      if (a !== b) {
        return a < b ? -1 : 1;
      }
    }
  }
  
  // If all parts are equal up to the min length, shorter one is less
  return v1Parts.length === v2Parts.length ? 0 : (v1Parts.length < v2Parts.length ? -1 : 1);
}

/**
 * Check if two versions are compatible
 * @param version1 First version to check
 * @param version2 Second version to check
 * @returns True if compatible, false otherwise
 */
export function areVersionsCompatible(version1: string, version2: string): boolean {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);
  
  // Major versions must match for compatibility
  return v1.major === v2.major;
}

/**
 * Check if a version meets the minimum compatibility requirements
 * @param version Version to check
 * @returns True if meets minimum requirements, false otherwise
 */
export function meetsMinimumRequirements(version: string): boolean {
  return compareVersions(version, COMPATIBILITY.MIN_COMPATIBLE_VERSION) >= 0;
}

/**
 * Check if a version is deprecated
 * @param version Version to check
 * @returns True if deprecated, false otherwise
 */
export function isDeprecated(version: string): boolean {
  if (!COMPATIBILITY.DEPRECATED_BELOW) {
    return false;
  }
  return compareVersions(version, COMPATIBILITY.DEPRECATED_BELOW) < 0;
}

/**
 * Check if an update is recommended
 * @param version Version to check
 * @returns True if update is recommended, false otherwise
 */
export function isUpdateRecommended(version: string): boolean {
  return compareVersions(version, COMPATIBILITY.RECOMMENDED_VERSION) < 0;
}

/**
 * Get library metadata
 * @returns Library metadata object
 */
export function getLibraryMetadata() {
  return {
    name: LIBRARY_NAME,
    version: VERSION,
    versionInfo: getVersionInfo(),
    compatibility: COMPATIBILITY,
    buildDate: new Date().toISOString()
  };
}