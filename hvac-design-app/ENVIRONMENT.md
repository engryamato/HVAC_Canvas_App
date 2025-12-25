# Environment Configuration Guide

This document explains how to configure environment variables for the HVAC Canvas application.

## 📋 Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Configuration Variables](#configuration-variables)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)

---

## Overview

The application uses environment variables to control features, debug settings, and API configurations. Different environment files are used for different deployment scenarios.

### Environment File Priority (Next.js)

Next.js loads environment variables in the following order (highest priority first):

1. `.env.local` (local overrides, gitignored)
2. `.env.production` or `.env.development` (based on NODE_ENV)
3. `.env` (default values, gitignored)
4. `.env.example` (documentation only, committed to git)

---

## Environment Files

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | Documentation and default values | ✅ Yes |
| `.env.local.example` | Template for local development | ✅ Yes |
| `.env.production` | Production configuration | ✅ Yes |
| `.env.local` | Local overrides (personal settings) | ❌ No (gitignored) |
| `.env` | Default environment variables | ❌ No (gitignored) |

---

## Configuration Variables

### App Configuration

```bash
# Application metadata
NEXT_PUBLIC_APP_NAME=SizeWise HVAC Canvas
NEXT_PUBLIC_APP_VERSION=0.1.0
```

### Feature Flags

```bash
# Enable/disable features at build time
NEXT_PUBLIC_ENABLE_WEATHER_API=false      # Weather API integration
NEXT_PUBLIC_ENABLE_ANALYTICS=false        # Usage analytics
NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false       # Cloud synchronization
```

### Development Settings

```bash
# Debug mode - MUST be false in production!
NEXT_PUBLIC_DEBUG_MODE=false

# Node environment
NODE_ENV=production  # or 'development' for local dev
```

### Security Variables

**⚠️ NEVER commit secrets to version control!**

```bash
# Example (use environment variables or secret managers):
# API_KEY=your-secret-key-here
# DATABASE_URL=your-database-url
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
```

---

## Development Setup

### Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** with your settings:
   ```bash
   NEXT_PUBLIC_DEBUG_MODE=true
   NODE_ENV=development
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Development Best Practices

- ✅ Use `.env.local` for personal settings
- ✅ Enable `DEBUG_MODE` for development
- ✅ Test with feature flags enabled/disabled
- ❌ Never commit `.env.local` to git
- ❌ Never hardcode secrets in code

---

## Production Setup

### Build Configuration

1. **Environment is automatically validated** during build:
   ```bash
   npm run build        # Validates before building
   npm run build:prod   # Explicitly sets NODE_ENV=production
   ```

2. **Production settings** (`.env.production`):
   ```bash
   NEXT_PUBLIC_DEBUG_MODE=false  # CRITICAL: Must be false!
   NODE_ENV=production
   NEXT_PUBLIC_ENABLE_ANALYTICS=false
   ```

3. **Tauri production build:**
   ```bash
   npm run tauri:build  # Validates and builds desktop app
   ```

### Production Checklist

- ✅ `DEBUG_MODE=false` in `.env.production`
- ✅ No secrets committed to git
- ✅ Feature flags configured correctly
- ✅ Environment validation passes
- ✅ Build completes without errors

---

## Validation

### Automatic Validation

The build process automatically validates environment variables:

```bash
# Runs before every build
npm run validate-env
```

### What Gets Validated

1. **DEBUG_MODE Check**
   - ✅ Ensures `DEBUG_MODE=false` in production builds
   - ❌ Fails build if `DEBUG_MODE=true` in production

2. **NODE_ENV Check**
   - ✅ Verifies NODE_ENV is set correctly
   - ⚠️ Warns if non-standard value

3. **Feature Flags Check**
   - ✅ Ensures boolean values (`true`/`false`)
   - ⚠️ Warns if invalid values

4. **Secrets Check**
   - ⚠️ Warns if placeholder values detected
   - ℹ️ Reminds about secret management

### Validation Output

**Success:**
```
ℹ INFO: Starting environment validation...
ℹ INFO: Build mode: PRODUCTION

✓ SUCCESS: NODE_ENV is set to: production
✓ SUCCESS: DEBUG_MODE is correctly set to: false
✓ SUCCESS: Feature flags are properly configured
✓ SUCCESS: No obvious secret configuration issues detected

✓ SUCCESS: All environment validations passed!
```

**Failure:**
```
✗ ERROR: NEXT_PUBLIC_DEBUG_MODE is set to true in production build!
✗ ERROR: This will expose debug information to end users.

✗ ERROR: To fix this:
1. Check your .env.production file
2. Ensure NEXT_PUBLIC_DEBUG_MODE=false
3. Remove any .env.local overrides for production builds

✗ ERROR: Environment validation failed!
```

---

## Troubleshooting

### Build Fails with "DEBUG_MODE is true"

**Problem:** Production build fails because DEBUG_MODE is enabled.

**Solution:**
1. Check `.env.production`:
   ```bash
   cat .env.production | grep DEBUG_MODE
   # Should output: NEXT_PUBLIC_DEBUG_MODE=false
   ```

2. Remove `.env.local` overrides:
   ```bash
   rm .env.local  # or edit to remove DEBUG_MODE
   ```

3. Rebuild:
   ```bash
   npm run build:prod
   ```

### Variables Not Updating

**Problem:** Changed environment variables but they're not reflected in the app.

**Solutions:**
1. **Restart dev server** (Next.js caches env vars):
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check file priority** (`.env.local` overrides `.env.production`):
   ```bash
   ls -la .env*
   ```

### Secrets Exposed in Client

**Problem:** Secret values visible in browser.

**Solutions:**
1. **Only use `NEXT_PUBLIC_` for client-side values**
   - ❌ Bad: `NEXT_PUBLIC_API_SECRET=xxx`
   - ✅ Good: `API_SECRET=xxx` (server-side only)

2. **Use API routes for server-side operations**:
   ```typescript
   // pages/api/secure.ts
   const secret = process.env.API_SECRET; // ✅ Server-side only
   ```

3. **Never hardcode secrets**:
   ```typescript
   // ❌ Bad
   const apiKey = "sk_live_123456";

   // ✅ Good
   const apiKey = process.env.API_KEY;
   ```

### Feature Flags Not Working

**Problem:** Feature flag changes don't take effect.

**Solutions:**
1. **Verify variable name** has `NEXT_PUBLIC_` prefix:
   ```bash
   # ❌ Won't work client-side
   ENABLE_ANALYTICS=true

   # ✅ Works client-side
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

2. **Rebuild after changing flags**:
   ```bash
   npm run build
   ```

3. **Check in browser console**:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS);
   ```

---

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Tauri Environment Variables](https://tauri.app/v1/guides/building/windows/)
- [12-Factor App Configuration](https://12factor.net/config)

---

## Quick Reference

### Development Commands
```bash
npm run dev              # Start dev server
npm run validate-env     # Check environment config
```

### Production Commands
```bash
npm run build:prod       # Build for production
npm run tauri:build      # Build desktop app
npm run validate-env     # Manual validation
```

### File Locations
```
hvac-design-app/
├── .env.example              # Documentation
├── .env.local.example        # Development template
├── .env.production           # Production config
├── .env.local                # Local overrides (gitignored)
└── scripts/
    └── validate-env.js       # Validation script
```

---

**Last Updated:** 2025-12-25
**Version:** 1.0.0
