import { test, expect } from '@playwright/test';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

// Lighthouse performance thresholds
const LIGHTHOUSE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 95,
  pwa: 80
};

test.describe('Lighthouse Performance Tests', () => {
  test('Homepage Lighthouse Audit', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Navigate to the page
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Run Lighthouse audit
      const { lhr } = await lighthouse('http://localhost:3000', {
        port: new URL(browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'info',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']
      });
      
      // Extract scores
      const scores = {
        performance: lhr.categories.performance.score * 100,
        accessibility: lhr.categories.accessibility.score * 100,
        bestPractices: lhr.categories['best-practices'].score * 100,
        seo: lhr.categories.seo.score * 100,
        pwa: lhr.categories.pwa.score * 100
      };
      
      // Assert scores meet thresholds
      expect(scores.performance).toBeGreaterThanOrEqual(LIGHTHOUSE_THRESHOLDS.performance);
      expect(scores.accessibility).toBeGreaterThanOrEqual(LIGHTHOUSE_THRESHOLDS.accessibility);
      expect(scores.bestPractices).toBeGreaterThanOrEqual(LIGHTHOUSE_THRESHOLDS.bestPractices);
      expect(scores.seo).toBeGreaterThanOrEqual(LIGHTHOUSE_THRESHOLDS.seo);
      expect(scores.pwa).toBeGreaterThanOrEqual(LIGHTHOUSE_THRESHOLDS.pwa);
      
      // Log detailed results
      console.log('Lighthouse Scores:', scores);
      
      // Log performance opportunities
      const opportunities = lhr.categories.performance.auditRefs
        .filter(audit => audit.result.score < 0.9)
        .map(audit => ({
          id: audit.id,
          title: audit.result.title,
          score: audit.result.score,
          description: audit.result.description
        }));
      
      if (opportunities.length > 0) {
        console.log('Performance Opportunities:', opportunities);
      }
      
    } finally {
      await browser.close();
    }
  });

  test('Mobile Performance Audit', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to the page
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Run Lighthouse audit with mobile configuration
      const { lhr } = await lighthouse('http://localhost:3000', {
        port: new URL(browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'info',
        onlyCategories: ['performance'],
        settings: {
          formFactor: 'mobile',
          throttling: {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4
          }
        }
      });
      
      const performanceScore = lhr.categories.performance.score * 100;
      
      // Mobile performance should be at least 80
      expect(performanceScore).toBeGreaterThanOrEqual(80);
      
      console.log('Mobile Performance Score:', performanceScore);
      
      // Check mobile-specific metrics
      const audits = lhr.audits;
      const mobileMetrics = {
        firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
        cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
        totalBlockingTime: audits['total-blocking-time']?.numericValue
      };
      
      console.log('Mobile Metrics:', mobileMetrics);
      
    } finally {
      await browser.close();
    }
  });

  test('Performance Budget Validation', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const { lhr } = await lighthouse('http://localhost:3000', {
        port: new URL(browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'info',
        onlyCategories: ['performance']
      });
      
      const audits = lhr.audits;
      
      // Validate Core Web Vitals
      const coreWebVitals = {
        LCP: audits['largest-contentful-paint']?.numericValue || 0,
        FID: audits['max-potential-fid']?.numericValue || 0,
        CLS: audits['cumulative-layout-shift']?.numericValue || 0
      };
      
      // Assert Core Web Vitals thresholds
      expect(coreWebVitals.LCP).toBeLessThan(2500); // Good LCP
      expect(coreWebVitals.FID).toBeLessThan(100);  // Good FID
      expect(coreWebVitals.CLS).toBeLessThan(0.1);  // Good CLS
      
      console.log('Core Web Vitals:', coreWebVitals);
      
      // Validate resource budgets
      const resourceBudgets = {
        totalByteWeight: audits['total-byte-weight']?.numericValue || 0,
        unusedJavaScript: audits['unused-javascript']?.numericValue || 0,
        unusedCSS: audits['unused-css-rules']?.numericValue || 0,
        unminifiedJavaScript: audits['unminified-javascript']?.numericValue || 0,
        unminifiedCSS: audits['unminified-css']?.numericValue || 0
      };
      
      // Assert resource budgets
      expect(resourceBudgets.totalByteWeight).toBeLessThan(1024 * 1024); // 1MB
      expect(resourceBudgets.unusedJavaScript).toBeLessThan(100 * 1024); // 100KB
      expect(resourceBudgets.unusedCSS).toBeLessThan(50 * 1024); // 50KB
      
      console.log('Resource Budgets:', resourceBudgets);
      
    } finally {
      await browser.close();
    }
  });
});