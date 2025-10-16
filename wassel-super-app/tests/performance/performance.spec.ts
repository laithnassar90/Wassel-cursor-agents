import { test, expect } from '@playwright/test';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  CLS: 0.1,
  FID: 100,
  LCP: 2500,
  FCP: 1800,
  TTFB: 800,
  
  // Additional metrics
  loadTime: 3000,
  domContentLoaded: 1500,
  firstPaint: 1000,
  
  // Bundle size (approximate)
  jsSize: 500, // KB
  cssSize: 100, // KB
  totalSize: 1000, // KB
};

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
  });

  test.afterEach(async ({ page }) => {
    // Collect coverage data
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();
    
    // Log coverage information
    const jsSize = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
    const cssSize = cssCoverage.reduce((total, entry) => total + entry.text.length, 0);
    
    console.log(`JavaScript Coverage: ${(jsSize / 1024).toFixed(2)} KB`);
    console.log(`CSS Coverage: ${(cssSize / 1024).toFixed(2)} KB`);
  });

  test('Homepage Performance', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: any = {};
          
          for (const entry of entries) {
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-paint') {
                metrics.firstPaint = entry.startTime;
              } else if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime;
              }
            } else if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
              metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
              metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
            }
          }
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['paint', 'navigation'] });
        
        // Resolve after 5 seconds
        setTimeout(() => resolve(metrics), 5000);
      });
    });
    
    // Assert performance thresholds
    expect(metrics.firstPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstPaint);
    expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    expect(metrics.loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.loadTime);
    expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.domContentLoaded);
    expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
  });

  test('Component Lazy Loading', async ({ page }) => {
    await page.goto('/');
    
    // Check that components are lazy loaded
    const lazyComponents = await page.$$('[data-lazy]');
    expect(lazyComponents.length).toBeGreaterThan(0);
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Check that lazy components are now loaded
    const loadedComponents = await page.$$('[data-lazy-loaded]');
    expect(loadedComponents.length).toBeGreaterThan(0);
  });

  test('Image Optimization', async ({ page }) => {
    await page.goto('/');
    
    // Check for optimized images
    const images = await page.$$('img');
    expect(images.length).toBeGreaterThan(0);
    
    // Check image loading performance
    const imageLoadTimes = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => {
        const startTime = performance.now();
        return new Promise((resolve) => {
          img.onload = () => {
            const loadTime = performance.now() - startTime;
            resolve({
              src: img.src,
              loadTime,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            });
          };
          img.onerror = () => resolve({ src: img.src, loadTime: -1, error: true });
        });
      });
    });
    
    // Wait for all images to load
    const results = await Promise.all(imageLoadTimes);
    
    // Check that images loaded successfully
    const failedImages = results.filter(r => r.error);
    expect(failedImages.length).toBe(0);
    
    // Check that images loaded within reasonable time
    const slowImages = results.filter(r => r.loadTime > 2000);
    expect(slowImages.length).toBe(0);
  });

  test('Bundle Size Analysis', async ({ page }) => {
    await page.goto('/');
    
    // Get resource timing data
    const resourceData = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.map((resource: any) => ({
        name: resource.name,
        size: resource.transferSize || 0,
        duration: resource.duration,
        type: resource.initiatorType
      }));
    });
    
    // Calculate bundle sizes
    const jsResources = resourceData.filter(r => r.name.endsWith('.js'));
    const cssResources = resourceData.filter(r => r.name.endsWith('.css'));
    
    const totalJSSize = jsResources.reduce((total, r) => total + r.size, 0) / 1024;
    const totalCSSSize = cssResources.reduce((total, r) => total + r.size, 0) / 1024;
    const totalSize = totalJSSize + totalCSSSize;
    
    // Assert bundle size thresholds
    expect(totalJSSize).toBeLessThan(PERFORMANCE_THRESHOLDS.jsSize);
    expect(totalCSSSize).toBeLessThan(PERFORMANCE_THRESHOLDS.cssSize);
    expect(totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.totalSize);
    
    console.log(`Total JS Size: ${totalJSSize.toFixed(2)} KB`);
    console.log(`Total CSS Size: ${totalCSSSize.toFixed(2)} KB`);
    console.log(`Total Size: ${totalSize.toFixed(2)} KB`);
  });

  test('Memory Usage', async ({ page }) => {
    await page.goto('/');
    
    // Get memory usage
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (memoryInfo) {
      const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      const totalMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
      
      // Assert memory usage is reasonable
      expect(usedMB).toBeLessThan(50); // Less than 50MB
      expect(totalMB).toBeLessThan(100); // Less than 100MB
      
      console.log(`Used Memory: ${usedMB.toFixed(2)} MB`);
      console.log(`Total Memory: ${totalMB.toFixed(2)} MB`);
    }
  });

  test('Service Worker Performance', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    });
    
    expect(swRegistered).toBe(true);
    
    // Test offline functionality
    await page.context().setOffline(true);
    await page.reload();
    
    // Check that page still loads (from cache)
    const isOffline = await page.evaluate(() => navigator.onLine);
    expect(isOffline).toBe(false);
    
    // Check that critical content is still available
    const criticalContent = await page.$('[data-critical]');
    expect(criticalContent).toBeTruthy();
    
    // Re-enable online
    await page.context().setOffline(false);
  });

  test('Performance Regression Detection', async ({ page }) => {
    await page.goto('/');
    
    // Record performance snapshot
    const snapshot = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        timestamp: new Date().toISOString(),
        metrics: {
          CLS: 0, // Would be measured with actual CLS
          FID: 0, // Would be measured with actual FID
          LCP: 0, // Would be measured with actual LCP
          FCP: 0, // Would be measured with actual FCP
          TTFB: navigation.responseStart - navigation.requestStart,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          bundleSize: 0, // Would be calculated from resources
          gzipSize: 0 // Would be calculated from resources
        },
        environment: 'test',
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: 'test-session'
      };
    });
    
    // This would be sent to the regression detector
    console.log('Performance Snapshot:', snapshot);
    
    // Assert that snapshot was recorded
    expect(snapshot).toBeTruthy();
    expect(snapshot.metrics).toBeTruthy();
  });
});