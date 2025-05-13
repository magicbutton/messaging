/**
 * Version management utilities for the messaging library
 */

import fs from 'fs';
import path from 'path';

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  buildMetadata?: string;
}

/**
 * Parses a semantic version string into its components
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
 * Get the current version from package.json
 * @returns Current version string
 */
export function getCurrentVersion(): string {
  const packageJsonPath = path.resolve(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

/**
 * Get parsed information about the current version
 * @returns Current version information
 */
export function getVersionInfo(): VersionInfo {
  return parseVersion(getCurrentVersion());
}

/**
 * Update the version in package.json
 * @param type Type of version bump ('major', 'minor', 'patch', or 'prerelease')
 * @param prereleaseId Prerelease identifier (e.g., 'alpha', 'beta', 'rc')
 * @returns The new version string
 */
export function updateVersion(type: 'major' | 'minor' | 'patch' | 'prerelease', prereleaseId?: string): string {
  const packageJsonPath = path.resolve(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = parseVersion(packageJson.version);
  
  let newVersion: string;
  
  switch (type) {
    case 'major':
      newVersion = `${currentVersion.major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${currentVersion.major}.${currentVersion.minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch + 1}`;
      break;
    case 'prerelease':
      if (!prereleaseId) {
        throw new Error('Prerelease identifier is required for prerelease updates');
      }
      // If already a prerelease with the same id, increment the prerelease number
      if (currentVersion.prerelease && currentVersion.prerelease.startsWith(prereleaseId)) {
        const parts = currentVersion.prerelease.split('.');
        const currentPrereleaseNum = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        newVersion = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}-${prereleaseId}.${currentPrereleaseNum + 1}`;
      } else {
        // Otherwise, start a new prerelease
        newVersion = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}-${prereleaseId}.0`;
      }
      break;
    default:
      throw new Error(`Invalid version bump type: ${type}`);
  }
  
  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  return newVersion;
}

/**
 * Get metadata about the library
 * @returns Library metadata
 */
export function getLibraryMetadata() {
  const versionInfo = getVersionInfo();
  return {
    name: '@magicbutton.cloud/messaging',
    version: versionInfo.version,
    buildDate: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Get version compatibility information
 * @returns Compatibility information
 */
export function getCompatibilityInfo() {
  const versionInfo = getVersionInfo();
  return {
    minCompatibleVersion: `${versionInfo.major}.0.0`,
    recommendedVersion: versionInfo.version,
    deprecatedBelow: versionInfo.major > 1 ? `${versionInfo.major - 1}.0.0` : null
  };
}