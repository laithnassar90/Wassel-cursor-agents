import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Start the application
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify the application is running
    const title = await page.title();
    console.log(`✅ Application is running: ${title}`);
    
    // Set up performance monitoring
    await page.evaluate(() => {
      // Initialize performance monitoring
      if (typeof window !== 'undefined') {
        (window as any).performanceMonitoring = {
          startTime: performance.now(),
          metrics: []
        };
      }
    });
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;