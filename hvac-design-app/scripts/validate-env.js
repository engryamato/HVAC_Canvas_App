#!/usr/bin/env node
/**
 * Environment Validation Script
 *
 * Validates environment variables before production builds.
 * Prevents common misconfigurations that could leak debug info or secrets.
 */

const fs = require('node:fs');
const path = require('node:path');

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, prefix, message) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

function error(message) {
  log('red', '✗ ERROR:', message);
}

function success(message) {
  log('green', '✓ SUCCESS:', message);
}

function warn(message) {
  log('yellow', '⚠ WARNING:', message);
}

function info(message) {
  log('blue', 'ℹ INFO:', message);
}

/**
 * Check if we're building for production
 */
function isProductionBuild() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate DEBUG_MODE setting
 */
function validateDebugMode() {
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE;

  if (debugMode === undefined) {
    warn('NEXT_PUBLIC_DEBUG_MODE is not set, defaulting to false');
    return true;
  }

  if (debugMode === 'true' && isProductionBuild()) {
    error('NEXT_PUBLIC_DEBUG_MODE is set to true in production build!');
    error('This will expose debug information to end users.');
    error('');
    error('To fix this:');
    error('1. Check your .env.production file');
    error('2. Ensure NEXT_PUBLIC_DEBUG_MODE=false');
    error('3. Remove any .env.local overrides for production builds');
    return false;
  }

  success(`DEBUG_MODE is correctly set to: ${debugMode}`);
  return true;
}

/**
 * Validate NODE_ENV setting
 */
function validateNodeEnv() {
  const nodeEnv = process.env.NODE_ENV;

  if (!nodeEnv) {
    warn('NODE_ENV is not set');
    return true;
  }

  if (nodeEnv !== 'production' && nodeEnv !== 'development' && nodeEnv !== 'test') {
    warn(`NODE_ENV is set to non-standard value: ${nodeEnv}`);
  }

  success(`NODE_ENV is set to: ${nodeEnv}`);
  return true;
}

/**
 * Check for common secret patterns in environment variables
 */
function validateSecrets() {
  const secretPatterns = [
    'PASSWORD',
    'SECRET',
    'API_KEY',
    'PRIVATE_KEY',
    'TOKEN',
    'CREDENTIALS',
  ];

  let hasWarnings = false;

  Object.keys(process.env).forEach((key) => {
    // Skip if it's a public Next.js variable
    if (key.startsWith('NEXT_PUBLIC_')) {
      return;
    }

    // Check if key matches secret pattern
    const isSecret = secretPatterns.some((pattern) => key.includes(pattern));

    if (isSecret && isProductionBuild()) {
      const value = process.env[key];

      // Check for placeholder/example values
      if (value === 'your-secret-here' || value === 'changeme' || value === 'example') {
        warn(`Secret ${key} appears to have a placeholder value`);
        hasWarnings = true;
      }
    }
  });

  if (!hasWarnings) {
    success('No obvious secret configuration issues detected');
  }

  return true;
}

/**
 * Validate feature flags are properly configured
 */
function validateFeatureFlags() {
  const flags = {
    NEXT_PUBLIC_ENABLE_WEATHER_API: process.env.NEXT_PUBLIC_ENABLE_WEATHER_API,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_CLOUD_SYNC: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC,
  };

  let allValid = true;

  Object.entries(flags).forEach(([key, value]) => {
    if (value !== 'true' && value !== 'false' && value !== undefined) {
      warn(`${key} has non-boolean value: ${value}`);
      allValid = false;
    }
  });

  if (allValid) {
    success('Feature flags are properly configured');
  }

  return true;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  console.log('');
  info('Starting environment validation...');
  info(`Build mode: ${isProductionBuild() ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log('');

  const validations = [
    validateNodeEnv(),
    validateDebugMode(),
    validateFeatureFlags(),
    validateSecrets(),
  ];

  const allPassed = validations.every((result) => result === true);

  console.log('');

  if (allPassed) {
    success('All environment validations passed!');
    console.log('');
    process.exit(0);
  } else {
    error('Environment validation failed!');
    console.log('');
    process.exit(1);
  }
}

// Run validation
validateEnvironment();
