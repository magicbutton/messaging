#!/usr/bin/env node

/**
 * Version bumping script for messaging library
 * 
 * Usage:
 *   node scripts/bump-version.js [major|minor|patch|prerelease] [prerelease-id]
 * 
 * Examples:
 *   node scripts/bump-version.js patch         # 1.0.0 -> 1.0.1
 *   node scripts/bump-version.js minor         # 1.0.0 -> 1.1.0
 *   node scripts/bump-version.js major         # 1.0.0 -> 2.0.0
 *   node scripts/bump-version.js prerelease alpha  # 1.0.0 -> 1.0.0-alpha.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check arguments
const bumpType = process.argv[2];
const prereleaseId = process.argv[3];

if (!bumpType || !['major', 'minor', 'patch', 'prerelease'].includes(bumpType)) {
  console.error('Error: Please specify a valid bump type: major, minor, patch, or prerelease');
  process.exit(1);
}

if (bumpType === 'prerelease' && !prereleaseId) {
  console.error('Error: Prerelease identifier is required for prerelease bumps (e.g., alpha, beta, rc)');
  process.exit(1);
}

// Read package.json
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonContent);
const currentVersion = packageJson.version;

// Parse version
const parseVersion = (version) => {
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
};

// Calculate new version
const calculateNewVersion = (current, type, preId) => {
  const parsed = parseVersion(current);
  
  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    case 'prerelease':
      // If already a prerelease with the same id, increment the prerelease number
      if (parsed.prerelease && parsed.prerelease.startsWith(preId)) {
        const parts = parsed.prerelease.split('.');
        const currentPrereleaseNum = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preId}.${currentPrereleaseNum + 1}`;
      } else {
        // Otherwise, start a new prerelease
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preId}.0`;
      }
    default:
      throw new Error(`Invalid version bump type: ${type}`);
  }
};

// Calculate new version
const newVersion = calculateNewVersion(currentVersion, bumpType, prereleaseId);

// Update version in package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update version in constants file if it exists
const constantsPath = path.resolve(__dirname, '..', 'lib', 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constantsContent = fs.readFileSync(constantsPath, 'utf8');
  constantsContent = constantsContent.replace(
    /export const VERSION = ['"].*?['"]/,
    `export const VERSION = '${newVersion}'`
  );
  fs.writeFileSync(constantsPath, constantsContent);
}

// Create a new entry in CHANGELOG.md if it exists
const changelogPath = path.resolve(__dirname, '..', 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  let changelogContent = fs.readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  
  const newEntry = `\n## [${newVersion}] - ${today}\n\n### Added\n- New features here\n\n### Changed\n- Changes here\n\n### Fixed\n- Bug fixes here\n`;
  
  // Add new entry after the header
  changelogContent = changelogContent.replace(
    /# Changelog\n/,
    `# Changelog\n${newEntry}`
  );
  
  fs.writeFileSync(changelogPath, changelogContent);
}

// Log the update
console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

// Optionally commit the changes
const shouldCommit = process.argv.includes('--commit');
if (shouldCommit) {
  try {
    // Stage the changes
    execSync('git add package.json');
    
    if (fs.existsSync(constantsPath)) {
      execSync('git add lib/constants.ts');
    }
    
    if (fs.existsSync(changelogPath)) {
      execSync('git add CHANGELOG.md');
    }
    
    // Commit the changes
    execSync(`git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`Changes committed with message: "chore: bump version to ${newVersion}"`);
  } catch (error) {
    console.error('Error committing changes:', error.message);
  }
}

// Done
process.exit(0);