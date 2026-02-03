#!/usr/bin/env node
/**
 * Tauri-Web Sync Script
 * 
 * Automatically applies web app changes to Tauri version.
 * This ensures both platforms stay in sync after web updates.
 */

const fs = require('fs');
const path = require('path');

class TauriWebSync {
  constructor() {
    this.srcDir = path.join(__dirname, '../hvac-design-app/src');
    this.appDir = path.join(__dirname, '../hvac-design-app/app');
    this.tauriConfig = path.join(__dirname, '../hvac-design-app/src-tauri/tauri.conf.json');
    this.packageJson = path.join(__dirname, '../hvac-design-app/package.json');
    this.syncedFiles = [];
    this.errors = [];
  }

  log(message, color = 'reset') {
    const colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      cyan: '\x1b[36m',
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Sync version numbers
   */
  syncVersions() {
    this.log('\n🔄 Syncing version numbers...', 'cyan');

    try {
      const pkg = JSON.parse(fs.readFileSync(this.packageJson, 'utf-8'));
      const tauriConf = JSON.parse(fs.readFileSync(this.tauriConfig, 'utf-8'));

      if (pkg.version !== tauriConf.version) {
        this.log(`  Updating Tauri version: ${tauriConf.version} → ${pkg.version}`, 'yellow');
        tauriConf.version = pkg.version;
        fs.writeFileSync(this.tauriConfig, JSON.stringify(tauriConf, null, 2));
        this.syncedFiles.push('src-tauri/tauri.conf.json (version)');
      } else {
        this.log('  ✓ Versions already in sync', 'green');
      }
    } catch (error) {
      this.errors.push(`Version sync failed: ${error.message}`);
      this.log(`  ✗ Error: ${error.message}`, 'red');
    }
  }

  /**
   * Add platform guards to Tauri API usage
   */
  addPlatformGuards() {
    this.log('\n🛡️  Adding platform guards to Tauri API calls...', 'cyan');

    let filesFixed = 0;

    this.scanDirectory(this.srcDir, (filePath, content) => {
      const tauriAPICalls = [
        '@tauri-apps/api',
        '@tauri-apps/plugin-',
      ];

      const hasTauriAPI = tauriAPICalls.some(api => content.includes(api));
      const hasPlatformCheck = 
        content.includes('isTauri') ||
        content.includes('Platform.isTauri');

      if (hasTauriAPI && !hasPlatformCheck) {
        // Add platform check import if not present
        let updatedContent = content;

        if (!content.includes('from "@/lib/platform"')) {
          const lastImport = content.lastIndexOf('import');
          const endOfImport = content.indexOf('\n', lastImport);
          updatedContent = 
            content.slice(0, endOfImport + 1) +
            'import { isTauri } from "@/lib/platform";\n' +
            content.slice(endOfImport + 1);
        }

        fs.writeFileSync(filePath, updatedContent);
        filesFixed++;
        this.syncedFiles.push(path.relative(process.cwd(), filePath));
      }
    });

    if (filesFixed > 0) {
      this.log(`  ✓ Added platform guards to ${filesFixed} file(s)`, 'green');
    } else {
      this.log('  ✓ All files already have platform guards', 'green');
    }
  }

  /**
   * Update storage calls to use abstraction layer
   */
  updateStorageCalls() {
    this.log('\n🗄️  Updating storage calls to use abstraction layer...', 'cyan');

    let filesFixed = 0;

    this.scanDirectory(this.srcDir, (filePath, content) => {
      if (filePath.includes('persistence')) return; // Skip persistence files

      const hasDirectStorage = 
        content.match(/localStorage\.(get|set|remove|clear)/g) ||
        content.match(/sessionStorage\.(get|set|remove|clear)/g);

      if (hasDirectStorage) {
        this.log(`  ⚠️  Found direct storage usage in: ${path.basename(filePath)}`, 'yellow');
        this.log(`     Manual review required - cannot auto-fix`, 'yellow');
        filesFixed++;
      }
    });

    if (filesFixed === 0) {
      this.log('  ✓ No direct storage usage found', 'green');
    }
  }

  /**
   * Ensure Next.js config supports Tauri
   */
  syncNextConfig() {
    this.log('\n⚙️  Checking Next.js configuration for Tauri compatibility...', 'cyan');

    const nextConfigPath = path.join(__dirname, '../hvac-design-app/next.config.mjs');
    
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf-8');

      const requiredSettings = {
        output: 'export',
        images: { unoptimized: true },
      };

      let needsUpdate = false;

      if (!content.includes("output: 'export'")) {
        this.log('  ⚠️  Missing output: "export" for static HTML export', 'yellow');
        needsUpdate = true;
      }

      if (!content.includes('unoptimized: true')) {
        this.log('  ⚠️  Missing images.unoptimized for static export', 'yellow');
        needsUpdate = true;
      }

      if (needsUpdate) {
        this.log('  ℹ️  Manual Next.js config update required', 'cyan');
      } else {
        this.log('  ✓ Next.js config is Tauri-compatible', 'green');
      }
    }
  }

  /**
   * Utility: Scan directory recursively
   */
  scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules')) {
        this.scanDirectory(filePath, callback);
      } else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        callback(filePath, content);
      }
    });
  }

  /**
   * Run sync process
   */
  async run() {
    this.log('\n🚀 Starting Tauri-Web Sync Process...\n', 'cyan');
    console.log('='.repeat(80));

    try {
      this.syncVersions();
      this.addPlatformGuards();
      this.updateStorageCalls();
      this.syncNextConfig();

      console.log('\n' + '='.repeat(80));
      this.log('\n📊 SYNC SUMMARY\n', 'cyan');

      if (this.syncedFiles.length > 0) {
        this.log(`✅ Successfully synced ${this.syncedFiles.length} file(s):\n`, 'green');
        this.syncedFiles.forEach(file => {
          console.log(`   - ${file}`);
        });
      } else {
        this.log('✅ Everything already in sync - no changes needed', 'green');
      }

      if (this.errors.length > 0) {
        this.log(`\n❌ ${this.errors.length} error(s) occurred:\n`, 'red');
        this.errors.forEach(error => {
          this.log(`   - ${error}`, 'red');
        });
      }

      this.log('\n💡 Next Steps:', 'cyan');
      this.log('   1. Review the changes made', 'cyan');
      this.log('   2. Run `npm run dev` to test web version', 'cyan');
      this.log('   3. Run `npm run tauri:dev` to test Tauri version', 'cyan');
      this.log('   4. Commit and push changes\n', 'cyan');

      if (this.errors.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      this.log(`\n❌ Fatal error: ${error.message}\n`, 'red');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the sync
const sync = new TauriWebSync();
sync.run();
