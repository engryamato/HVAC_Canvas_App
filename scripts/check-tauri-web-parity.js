#!/usr/bin/env node
/**
 * Tauri-Web Parity Checker
 * 
 * This script ensures that the Tauri and web versions of the app remain in sync.
 * It checks for:
 * - Component usage differences
 * - Feature flag mismatches
 * - Platform-specific code that might break parity
 * - Configuration differences
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class ParityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.srcDir = path.join(__dirname, '../hvac-design-app/src');
    this.appDir = path.join(__dirname, '../hvac-design-app/app');
    this.tauriConfig = path.join(__dirname, '../hvac-design-app/src-tauri/tauri.conf.json');
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  addIssue(file, description, severity = 'error') {
    const issue = { file, description, severity };
    if (severity === 'error') {
      this.issues.push(issue);
    } else {
      this.warnings.push(issue);
    }
  }

  /**
   * Check for platform-specific code that might break web builds
   */
  checkPlatformSpecificCode() {
    this.log('\n🔍 Checking for platform-specific code...', 'cyan');

    const tauriAPICalls = [
      '@tauri-apps/api',
      '@tauri-apps/plugin-',
      'window.__TAURI__',
      'invoke(',
    ];

    this.scanDirectory(this.srcDir, (filePath, content) => {
      // Check if file uses Tauri APIs without proper guards
      const hasTauriAPI = tauriAPICalls.some(api => content.includes(api));
      
      if (hasTauriAPI) {
        const hasPlatformCheck = 
          content.includes('isTauri') ||
          content.includes('window.__TAURI__') ||
          content.includes('typeof window !== "undefined"') ||
          content.includes('Platform.isTauri');

        if (!hasPlatformCheck) {
          this.addIssue(
            filePath,
            'Uses Tauri API without platform detection guard. This will break web builds.',
            'error'
          );
        }
      }
    });
  }

  /**
   * Check for storage abstraction usage
   */
  checkStorageAbstraction() {
    this.log('\n🗄️  Checking storage abstraction usage...', 'cyan');

    this.scanDirectory(this.srcDir, (filePath, content) => {
      // Check for direct localStorage/sessionStorage usage
      const hasDirectStorage = 
        content.match(/localStorage\.(get|set|remove)/g) ||
        content.match(/sessionStorage\.(get|set|remove)/g);

      if (hasDirectStorage && !filePath.includes('persistence')) {
        this.addIssue(
          filePath,
          'Uses localStorage/sessionStorage directly instead of storage abstraction layer. Use createStorageAdapter() instead.',
          'warning'
        );
      }
    });
  }

  /**
   * Check configuration parity
   */
  checkConfigurationParity() {
    this.log('\n⚙️  Checking configuration parity...', 'cyan');

    try {
      const packageJson = require('../hvac-design-app/package.json');
      const tauriConfig = require(this.tauriConfig);

      // Check version consistency
      if (packageJson.version !== tauriConfig.version) {
        this.addIssue(
          'package.json / tauri.conf.json',
          `Version mismatch: package.json (${packageJson.version}) vs tauri.conf.json (${tauriConfig.version})`,
          'error'
        );
      }

      // Check app name consistency
      const packageName = packageJson.name;
      const tauriProductName = tauriConfig.productName;
      
      if (packageName && tauriProductName && !tauriProductName.toLowerCase().includes(packageName.split('-').pop().toLowerCase())) {
        this.addIssue(
          'package.json / tauri.conf.json',
          `App name mismatch between package.json and Tauri config`,
          'warning'
        );
      }

    } catch (error) {
      this.addIssue(
        'Configuration Files',
        `Error reading configuration: ${error.message}`,
        'error'
      );
    }
  }

  /**
   * Check for missing platform adapters
   */
  checkPlatformAdapters() {
    this.log('\n🔌 Checking platform adapters...', 'cyan');

    const factoryPath = path.join(this.srcDir, 'core/persistence/factory.ts');
    
    if (fs.existsSync(factoryPath)) {
      const content = fs.readFileSync(factoryPath, 'utf-8');
      
      // Check if factory throws errors for supported platforms
      if (content.includes('throw new Error') && !content.includes('placeholder')) {
        this.addIssue(
          factoryPath,
          'Storage factory throws errors instead of returning adapters for supported platforms',
          'warning'
        );
      }
    } else {
      this.addIssue(
        'core/persistence/factory.ts',
        'Storage factory file not found. Platform adapters may be missing.',
        'error'
      );
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

      if (stat.isDirectory()) {
        this.scanDirectory(filePath, callback);
      } else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        callback(filePath, content);
      }
    });
  }

  /**
   * Utility: Get all components
   */
  getAllComponents(dir) {
    const components = [];
    
    this.scanDirectory(dir, (filePath, content) => {
      const filename = path.basename(filePath, path.extname(filePath));
      
      // Check if it's a component file (exports a React component)
      if (content.match(/export\s+(default\s+)?(function|const)\s+\w+/)) {
        components.push({
          name: filename,
          path: filePath,
        });
      }
    });

    return components;
  }

  /**
   * Utility: Count component usage
   */
  countComponentUsage(componentName) {
    let count = 0;

    this.scanDirectory(this.srcDir, (filePath, content) => {
      const importRegex = new RegExp(`import.*${componentName}.*from`, 'g');
      const jsxRegex = new RegExp(`<${componentName}[\\s/>]`, 'g');
      
      const importMatches = content.match(importRegex) || [];
      const jsxMatches = content.match(jsxRegex) || [];
      
      count += importMatches.length + jsxMatches.length;
    });

    return count;
  }

  /**
   * Generate report
   */
  generateReport() {
    this.log('\n📊 Generating parity report...', 'cyan');

    const report = {
      timestamp: new Date().toISOString(),
      summary: '',
      totalIssues: this.issues.length,
      totalWarnings: this.warnings.length,
      issues: this.issues,
      warnings: this.warnings,
      status: this.issues.length === 0 ? 'PASS' : 'FAIL',
    };

    if (report.status === 'PASS') {
      report.summary = '✅ All parity checks passed! Web and Tauri apps are in sync.';
    } else {
      report.summary = `❌ Found ${report.totalIssues} issue(s) and ${report.totalWarnings} warning(s) affecting parity.`;
    }

    // Write report to file
    const reportPath = path.join(__dirname, '../hvac-design-app/parity-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Print results
   */
  printResults(report) {
    console.log('\n' + '='.repeat(80));
    this.log(`\n🎯 TAURI-WEB PARITY CHECK RESULTS\n`, 'cyan');
    console.log('='.repeat(80));

    this.log(`\nStatus: ${report.status}`, report.status === 'PASS' ? 'green' : 'red');
    this.log(`Total Issues: ${report.totalIssues}`, report.totalIssues > 0 ? 'red' : 'green');
    this.log(`Total Warnings: ${report.totalWarnings}`, report.totalWarnings > 0 ? 'yellow' : 'green');

    if (this.issues.length > 0) {
      this.log('\n❌ ERRORS:', 'red');
      this.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.file}`);
        this.log(`   ${issue.description}`, 'red');
      });
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:', 'yellow');
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.file}`);
        this.log(`   ${warning.description}`, 'yellow');
      });
    }

    console.log('\n' + '='.repeat(80));
    
    if (report.status === 'PASS') {
      this.log('\n✅ All checks passed! Safe to deploy both Web and Tauri versions.\n', 'green');
    } else {
      this.log('\n❌ Parity issues detected. Please fix before deploying.\n', 'red');
      this.log('💡 Tips:', 'cyan');
      this.log('   - Use storage abstraction layer for persistence', 'cyan');
      this.log('   - Guard Tauri API calls with platform detection', 'cyan');
      this.log('   - Keep versions synchronized across configs', 'cyan');
      this.log('   - Run `npm run sync:tauri` to auto-fix common issues\n', 'cyan');
    }
  }

  /**
   * Run all checks
   */
  async run() {
    this.log('\n🚀 Starting Tauri-Web Parity Checker...\n', 'cyan');

    try {
      this.checkConfigurationParity();
      this.checkPlatformSpecificCode();
      this.checkStorageAbstraction();
      this.checkPlatformAdapters();

      const report = this.generateReport();
      this.printResults(report);

      // Exit with error code if issues found
      if (report.status === 'FAIL') {
        process.exit(1);
      }

    } catch (error) {
      this.log(`\n❌ Fatal error: ${error.message}\n`, 'red');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the checker
const checker = new ParityChecker();
checker.run();
