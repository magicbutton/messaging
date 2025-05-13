#!/usr/bin/env bash

# Build script with version bumping support

set -e  # Exit on error

# Check for version bump type argument
bump_type=""
if [ $# -gt 0 ]; then
  bump_type=$1
  prerelease_id=$2
  
  # Validate bump type
  if [[ "$bump_type" != "major" && "$bump_type" != "minor" && "$bump_type" != "patch" && "$bump_type" != "prerelease" ]]; then
    echo "Error: Invalid bump type. Use 'major', 'minor', 'patch', or 'prerelease'"
    exit 1
  fi
  
  # Check for prerelease id if needed
  if [[ "$bump_type" == "prerelease" && -z "$prerelease_id" ]]; then
    echo "Error: Prerelease identifier required for prerelease bumps"
    exit 1
  fi
  
  # Run bump version script
  echo "Bumping version ($bump_type)..."
  if [[ "$bump_type" == "prerelease" ]]; then
    node scripts/bump-version.js "$bump_type" "$prerelease_id"
  else
    node scripts/bump-version.js "$bump_type"
  fi
fi

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf dist lib/*.js lib/*.d.ts *.d.ts *.js.map *.d.ts.map

# Build TypeScript
echo "Building TypeScript..."
npx tsc

# Copy package.json and README to dist
echo "Copying package files..."
cp package.json README.md CHANGELOG.md dist/

# Update paths in package.json for distribution
echo "Updating package.json for distribution..."
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  
  // Update main, types, and other paths
  pkg.main = 'index.js';
  pkg.types = 'index.d.ts';
  
  // Remove scripts and devDependencies
  delete pkg.scripts;
  delete pkg.devDependencies;
  
  // Write updated package.json
  fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Build completed successfully!"
exit 0