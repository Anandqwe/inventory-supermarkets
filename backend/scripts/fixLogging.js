#!/usr/bin/env node
/**
 * Script to replace all console.log/error/warn with logger
 * Run this to fix all logging issues at once
 */

const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg, meta = {}) => console.log(`[INFO] ${msg}`, meta),
  error: (msg, meta = {}) => console.error(`[ERROR] ${msg}`, meta),
  warn: (msg, meta = {}) => console.warn(`[WARN] ${msg}`, meta),
  debug: (msg, meta = {}) => console.log(`[DEBUG] ${msg}`, meta)
};

const filesToFix = [
  '../src/utils/dbOptimization.js',
  '../src/models/User.js',
  '../src/models/AuditLog.js',
  '../src/routes/masterDataRoutes.js',
  '../src/middleware/security.js',
  '../src/middleware/performanceMonitor.js',
  '../src/middleware/errorHandler.js',
  '../src/middleware/cache.js',
  '../src/middleware/inputSanitizer.js',
  '../src/middleware/auth.js',
  '../src/middleware/auditLogger.js',
  '../src/middleware/advancedRateLimit.js',
  '../src/config/database.js',
  '../src/config/cache.js',
  '../app.js'
];

const fixes = [];

filesToFix.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  logger.info(`Processing: ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    logger.warn(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let changeCount = 0;

  // Check if logger is already imported
  const hasLoggerImport = /const logger = require\(['"].*logger['"]\);/.test(content);

  // Add logger import if not present
  if (!hasLoggerImport && (/console\.(log|error|warn|info|debug)/.test(content))) {
    // Find first require statement
    const firstRequireMatch = content.match(/^const .* = require\(/m);
    if (firstRequireMatch) {
      const insertPos = content.indexOf(firstRequireMatch[0]);
      const loggerImport = 'const logger = require(\'./utils/logger\');\n';
      content = content.slice(0, insertPos) + loggerImport + content.slice(insertPos);
      changeCount++;
      logger.info(`Added logger import to ${relPath}`);
    }
  }

  // Replace console.log with logger.info
  content = content.replace(/console\.log\((.*?)\);/g, (match, args) => {
    changeCount++;
    // Try to extract string message and convert to logger format
    const trimmedArgs = args.trim();
    if (trimmedArgs.startsWith('\'') || trimmedArgs.startsWith('"') || trimmedArgs.startsWith('`')) {
      return `logger.info(${args});`;
    }
    return `logger.info(${args});`;
  });

  // Replace console.error with logger.error
  content = content.replace(/console\.error\((.*?)\);/g, (match, args) => {
    changeCount++;
    return `logger.error(${args});`;
  });

  // Replace console.warn with logger.warn
  content = content.replace(/console\.warn\((.*?)\);/g, (match, args) => {
    changeCount++;
    return `logger.warn(${args});`;
  });

  if (content !== originalContent) {
    // Backup original file
    fs.writeFileSync(`${fullPath}.backup`, originalContent);
    // Write fixed file
    fs.writeFileSync(fullPath, content);
    logger.info(`✅ Fixed ${changeCount} console statements in ${relPath}`);
    fixes.push({ file: relPath, changes: changeCount });
  } else {
    logger.info(`No changes needed for ${relPath}`);
  }
});

logger.info('\n' + '='.repeat(50));
logger.info('FIX SUMMARY');
logger.info('='.repeat(50));
fixes.forEach(fix => {
  logger.info(`${fix.file}: ${fix.changes} changes`);
});
logger.info(`Total files fixed: ${fixes.length}`);
logger.info('='.repeat(50));
logger.info('\n✅ All console.log statements have been replaced with logger!');
logger.info('⚠️  Backup files created with .backup extension');
logger.info('📝 Please review changes and test your application');
