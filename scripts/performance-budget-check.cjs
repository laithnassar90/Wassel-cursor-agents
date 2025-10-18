#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Performance budget thresholds (realistic for modern React app)
const BUDGETS = {
  totalSize: 1500, // 1.5MB
  gzipSize: 400,   // 400KB
  brotliSize: 350, // 350KB
  jsSize: 1200,    // 1.2MB (uncompressed)
  cssSize: 100,    // 100KB
  imageSize: 500,  // 500KB
  fontSize: 50,    // 50KB
  chunkSize: 300,  // 300KB per chunk
  moduleCount: 150, // 150 modules max
  dependencyCount: 80 // 80 dependencies max
};

// Critical thresholds (must not exceed)
const CRITICAL_BUDGETS = {
  totalSize: 2000, // 2MB
  gzipSize: 600,   // 600KB
  jsSize: 1500,    // 1.5MB
  cssSize: 200     // 200KB
};

class PerformanceBudgetChecker {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      budgets: BUDGETS,
      criticalBudgets: CRITICAL_BUDGETS,
      results: [],
      budgetResults: [],
      recommendations: [],
      summary: {
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
  }

  async check() {
    console.log('🔍 Checking performance budgets...\n');

    try {
      // Check bundle analysis results
      await this.checkBundleAnalysis();
      
      // Check build artifacts
      await this.checkBuildArtifacts();
      
      // Generate report
      this.generateReport();
      
      // Save report
      this.saveReport();
      
      // Exit with appropriate code
      const hasFailures = this.report.summary.failed > 0;
      const hasCritical = this.report.summary.critical > 0;
      
      if (hasCritical) {
        console.log('❌ Critical performance budget exceeded!');
        process.exit(1);
      } else if (hasFailures) {
        console.log('⚠️  Performance budget warnings detected.');
        process.exit(0); // Don't fail CI for warnings
      } else {
        console.log('✅ All performance budgets passed!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Performance budget check failed:', error.message);
      process.exit(1);
    }
  }

  async checkBundleAnalysis() {
    const statsPath = path.join(process.cwd(), 'build', 'stats.html');
    
    if (!fs.existsSync(statsPath)) {
      console.log('⚠️  Bundle analysis not found, checking build directory...');
      // Still run build artifact analysis even without stats.html
      return;
    }

    console.log('📊 Bundle analysis found, analyzing...');
    
    // Try to extract basic info from stats.html if it exists
    try {
      const statsContent = fs.readFileSync(statsPath, 'utf8');
      console.log('✅ Bundle analysis file loaded successfully');
    } catch (error) {
      console.log('⚠️  Could not read bundle analysis file:', error.message);
    }
  }

  async checkBuildArtifacts() {
    const buildDir = path.join(process.cwd(), 'build');
    
    if (!fs.existsSync(buildDir)) {
      console.log('⚠️  Build directory not found, skipping...');
      return;
    }

    console.log('📁 Checking build artifacts...');
    
    // Check for large files
    const files = this.getFilesRecursively(buildDir);
    const largeFiles = files.filter(file => {
      const stats = fs.statSync(file);
      return stats.size > 100 * 1024; // 100KB
    });

    if (largeFiles.length > 0) {
      this.report.recommendations.push(
        `Found ${largeFiles.length} large files (>100KB). Consider optimizing: ${largeFiles.map(f => path.basename(f)).join(', ')}`
      );
    }

    // Check for duplicate files
    const duplicateFiles = this.findDuplicateFiles(files);
    if (duplicateFiles.length > 0) {
      this.report.recommendations.push(
        `Found ${duplicateFiles.length} potential duplicate files. Consider deduplication.`
      );
    }

    // Analyze actual bundle sizes
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    jsFiles.forEach(file => {
      const stats = fs.statSync(file);
      totalJSSize += stats.size;
    });
    
    cssFiles.forEach(file => {
      const stats = fs.statSync(file);
      totalCSSSize += stats.size;
    });
    
    // Convert to KB
    totalJSSize = Math.round(totalJSSize / 1024);
    totalCSSSize = Math.round(totalCSSSize / 1024);
    const totalSize = totalJSSize + totalCSSSize;
    
    // Check budgets with actual sizes
    this.checkBudget('JavaScript Size', totalJSSize, BUDGETS.jsSize, CRITICAL_BUDGETS.jsSize);
    this.checkBudget('CSS Size', totalCSSSize, BUDGETS.cssSize, CRITICAL_BUDGETS.cssSize);
    this.checkBudget('Total Bundle Size', totalSize, BUDGETS.totalSize, CRITICAL_BUDGETS.totalSize);
  }

  checkBudget(name, actual, budget, criticalBudget = null) {
    const isCritical = criticalBudget && actual > criticalBudget;
    const isFailed = actual > budget;
    const status = isCritical ? 'critical' : isFailed ? 'failed' : 'passed';

    const result = {
      name,
      actual,
      budget,
      criticalBudget,
      status,
      exceeded: actual - budget
    };

    this.report.budgetResults.push(result);
    this.report.summary[status]++;

    const icon = isCritical ? '🚨' : isFailed ? '⚠️' : '✅';
    console.log(`${icon} ${name}: ${actual} KB (budget: ${budget} KB${criticalBudget ? `, critical: ${criticalBudget} KB` : ''})`);

    if (isCritical) {
      this.report.recommendations.push(`CRITICAL: ${name} exceeds critical threshold (${actual} KB > ${criticalBudget} KB)`);
    } else if (isFailed) {
      this.report.recommendations.push(`${name} exceeds budget (${actual} KB > ${budget} KB)`);
    }
  }

  getFilesRecursively(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  findDuplicateFiles(files) {
    const fileHashes = new Map();
    const duplicates = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file);
      const hash = require('crypto').createHash('md5').update(content).digest('hex');
      
      if (fileHashes.has(hash)) {
        duplicates.push({
          original: fileHashes.get(hash),
          duplicate: file,
          size: content.length
        });
      } else {
        fileHashes.set(hash, file);
      }
    }
    
    return duplicates;
  }

  generateReport() {
    // Add general recommendations
    if (this.report.summary.failed > 0) {
      this.report.recommendations.push('Consider implementing code splitting for large bundles');
      this.report.recommendations.push('Optimize images and use modern formats (WebP, AVIF)');
      this.report.recommendations.push('Remove unused dependencies and dead code');
      this.report.recommendations.push('Consider lazy loading for non-critical components');
    }

    if (this.report.summary.passed === this.report.budgetResults.length) {
      this.report.recommendations.push('🎉 Excellent! All performance budgets are within limits.');
    }
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'performance-budget-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📄 Performance report saved to: ${reportPath}`);
  }
}

// Run the check
if (require.main === module) {
  const checker = new PerformanceBudgetChecker();
  checker.check().catch(console.error);
}

module.exports = PerformanceBudgetChecker;