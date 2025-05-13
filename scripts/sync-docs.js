#!/usr/bin/env node

/**
 * This script syncs the TypeDoc-generated markdown files from messaging/docs/markdown
 * to docs/docs/docs/messaging/typescript, while respecting the "locked: true" 
 * frontmatter in the target files.
 * 
 * Usage:
 *   node sync-docs.js         # Normal sync
 *   node sync-docs.js --dry   # Dry run (no actual changes)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');

// Statistics
const stats = {
  copied: 0,
  skipped: 0,
  created: 0,
  errors: 0,
};

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'docs', 'markdown');
const TARGET_DIR = path.join(__dirname, '..', '..', 'docs', 'docs', 'docs', 'messaging', 'typescript');

// Ensure target directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    if (!isDryRun) {
      fs.mkdirSync(dir, { recursive: true });
    }
    console.log(`${isDryRun ? '[DRY RUN] Would create' : 'Created'} directory: ${dir}`);
    stats.created++;
  }
}

// Check if file is locked
function isFileLocked(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Look for frontmatter with locked: true
    return content.includes('---') && 
           content.match(/^---[\s\S]*?locked:\s*true[\s\S]*?---/m);
  } catch (error) {
    console.error(`Error reading file to check if locked: ${filePath}`, error);
    stats.errors++;
    return false;  // Assume not locked on error
  }
}

// Copy a file if not locked
function copyFileIfNotLocked(source, target) {
  try {
    if (isFileLocked(target)) {
      console.log(`⚠️ Skipping locked file: ${path.relative(TARGET_DIR, target)}`);
      stats.skipped++;
      return;
    }

    // Read the source file
    const content = fs.readFileSync(source, 'utf8');

    // Create target directory if needed
    ensureDirectoryExists(path.dirname(target));

    if (!isDryRun) {
      // Write the file to the target
      fs.writeFileSync(target, content);
    }
    
    console.log(`${isDryRun ? '[DRY RUN] Would copy' : '✓ Copied'}: ${path.relative(SOURCE_DIR, source)} -> ${path.relative(TARGET_DIR, target)}`);
    stats.copied++;
  } catch (error) {
    console.error(`Error copying file: ${source} -> ${target}`, error);
    stats.errors++;
  }
}

// Recursively copy directory
function copyDirectory(sourceDir, targetDir) {
  ensureDirectoryExists(targetDir);

  try {
    const items = fs.readdirSync(sourceDir);

    for (const item of items) {
      const sourceItem = path.join(sourceDir, item);
      const targetItem = path.join(targetDir, item);
      
      const stats = fs.statSync(sourceItem);
      
      if (stats.isDirectory()) {
        copyDirectory(sourceItem, targetItem);
      } else if (stats.isFile()) {
        copyFileIfNotLocked(sourceItem, targetItem);
      }
    }
  } catch (error) {
    console.error(`Error processing directory: ${sourceDir}`, error);
    stats.errors++;
  }
}

// Main execution
console.log(`🚀 Starting TypeDoc markdown synchronization... ${isDryRun ? '(DRY RUN)' : ''}`);
console.log(`Source: ${SOURCE_DIR}`);
console.log(`Target: ${TARGET_DIR}`);
console.log('───────────────────────────────────────────────────');

try {
  copyDirectory(SOURCE_DIR, TARGET_DIR);
  
  console.log('───────────────────────────────────────────────────');
  console.log(`📊 Summary:`);
  console.log(`  • ${stats.copied} files ${isDryRun ? 'would be' : 'were'} copied`);
  console.log(`  • ${stats.skipped} files ${isDryRun ? 'would be' : 'were'} skipped (locked)`);
  console.log(`  • ${stats.created} directories ${isDryRun ? 'would be' : 'were'} created`);
  
  if (stats.errors > 0) {
    console.log(`  • ❌ ${stats.errors} errors occurred`);
    process.exit(1);
  } else {
    console.log(`\n✅ Documentation synchronization ${isDryRun ? 'dry run' : 'completed'} successfully!`);
  }
} catch (error) {
  console.error('❌ Error during synchronization:', error);
  process.exit(1);
}