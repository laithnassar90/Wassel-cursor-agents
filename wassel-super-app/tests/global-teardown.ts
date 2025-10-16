import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Collect final performance metrics
    await page.goto('http://localhost:3000');
    const finalMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        timestamp: new Date().toISOString()
      };
    });
    
    console.log('📊 Final performance metrics:', finalMetrics);
    
    // Save performance report
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, 'performance-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(finalMetrics, null, 2));
    
    console.log(`📄 Performance report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;