# 📚 Performance API Reference

## Table of Contents
1. [Performance Monitoring](#performance-monitoring)
2. [Caching System](#caching-system)
3. [Image Optimization](#image-optimization)
4. [A/B Testing](#ab-testing)
5. [Performance Alerts](#performance-alerts)
6. [Analytics](#analytics)
7. [Error Boundaries](#error-boundaries)
8. [Bundle Analysis](#bundle-analysis)

## Performance Monitoring

### `usePerformanceMonitoring()`

React hook for performance monitoring and Web Vitals tracking.

```typescript
import { usePerformanceMonitoring } from './utils/performance';

function MyComponent() {
  const {
    startMonitoring,
    stopMonitoring,
    getMetrics,
    getPerformanceScore,
    getRecommendations,
    clearMetrics
  } = usePerformanceMonitoring();

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  const score = getPerformanceScore();
  const recommendations = getRecommendations();

  return (
    <div>
      <p>Performance Score: {score}/100</p>
      <ul>
        {recommendations.map(rec => <li key={rec}>{rec}</li>)}
      </ul>
    </div>
  );
}
```

### `PerformanceMonitor` Class

Direct access to performance monitoring functionality.

```typescript
import { performanceMonitor } from './utils/performance';

// Start monitoring
performanceMonitor.startMonitoring();

// Get current metrics
const metrics = performanceMonitor.getMetrics();
console.log('CLS:', metrics.CLS);
console.log('FID:', metrics.FID);
console.log('LCP:', metrics.LCP);

// Get performance score
const score = performanceMonitor.getPerformanceScore();
console.log('Performance Score:', score);

// Get recommendations
const recommendations = performanceMonitor.getRecommendations();
console.log('Recommendations:', recommendations);
```

## Caching System

### `useCacheService()`

React hook for caching API calls and data.

```typescript
import { useCacheService } from './services/cacheService';

function UserProfile({ userId }) {
  const { cacheAPI, cacheUserData, invalidate } = useCacheService();

  const fetchUser = async () => {
    return cacheAPI(
      `users/${userId}`,
      () => fetch(`/api/users/${userId}`).then(r => r.json()),
      { ttl: 5 * 60 * 1000 } // 5 minutes
    );
  };

  const fetchUserPosts = async () => {
    return cacheUserData(
      userId,
      'posts',
      () => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
      { ttl: 10 * 60 * 1000 } // 10 minutes
    );
  };

  // Invalidate cache when user updates profile
  const updateProfile = async (data) => {
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    invalidate(`user:${userId}`);
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### Cache Configuration Presets

```typescript
import { CachePresets } from './services/cacheService';

// Use predefined cache configurations
const shortTermData = cacheAPI('recent-posts', fetchPosts, CachePresets.SHORT_TERM);
const userData = cacheUserData(userId, 'profile', fetchProfile, CachePresets.USER_DATA);
const staticContent = cacheAPI('config', fetchConfig, CachePresets.STATIC_CONTENT);
```

## Image Optimization

### `ImageOptimized` Component

Optimized image component with automatic format selection and lazy loading.

```typescript
import { ImageOptimized } from './components/ImageOptimized';

function MyComponent() {
  return (
    <div>
      {/* Basic usage */}
      <ImageOptimized
        src="/image.jpg"
        alt="Description"
        width={400}
        height={300}
      />

      {/* With optimization options */}
      <ImageOptimized
        src="/hero.jpg"
        alt="Hero image"
        width={1200}
        height={600}
        quality={90}
        loading="eager"
        priority
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..."
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Lazy loaded gallery */}
      <ImageGallery
        images={[
          { src: '/img1.jpg', alt: 'Image 1', width: 300, height: 200 },
          { src: '/img2.jpg', alt: 'Image 2', width: 300, height: 200 },
          { src: '/img3.jpg', alt: 'Image 3', width: 300, height: 200 }
        ]}
      />
    </div>
  );
}
```

### `useImageOptimization()` Hook

```typescript
import { useImageOptimization } from './utils/imageOptimization';

function MyComponent() {
  const {
    optimizeImage,
    generateResponsiveImages,
    generateBlurDataURL,
    preloadImage,
    getOptimalFormat
  } = useImageOptimization();

  // Optimize image URL
  const optimizedSrc = optimizeImage('/image.jpg', {
    width: 400,
    height: 300,
    quality: 85,
    format: 'webp'
  });

  // Generate responsive images
  const responsiveImages = generateResponsiveImages('/image.jpg', [320, 640, 1024]);

  // Generate blur placeholder
  const blurDataURL = generateBlurDataURL(10, 10);

  // Preload critical images
  useEffect(() => {
    preloadImage('/hero.jpg');
  }, []);

  return (
    <div>
      <img src={optimizedSrc} alt="Optimized image" />
    </div>
  );
}
```

## A/B Testing

### `useABTest()` Hook

React hook for A/B testing performance optimizations.

```typescript
import { useABTest } from './utils/abTesting';

function ImageComponent() {
  const { variantId, config, recordEvent, recordResult } = useABTest('image-optimization-test');

  // Record performance metrics
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      recordResult({
        metrics: {
          loadTime,
          variantId,
          testId: 'image-optimization-test'
        }
      });
    };
  }, []);

  // Record user interactions
  const handleClick = () => {
    recordEvent('image_click', {
      variantId,
      clickTime: Date.now()
    });
  };

  return (
    <ImageOptimized
      src="/image.jpg"
      format={config.imageFormat}
      quality={config.quality}
      onClick={handleClick}
    />
  );
}
```

### A/B Test Management

```typescript
import { abTestingFramework } from './utils/abTesting';

// Create a new A/B test
const testId = abTestingFramework.createTest({
  name: 'Bundle Size Optimization',
  description: 'Test different bundle splitting strategies',
  variants: [
    {
      name: 'Aggressive Splitting',
      config: { chunkSize: 100, lazyLoad: true },
      trafficWeight: 0.5
    },
    {
      name: 'Conservative Splitting',
      config: { chunkSize: 200, lazyLoad: false },
      trafficWeight: 0.5
    }
  ],
  successCriteria: {
    primaryMetric: 'bundleSize',
    minimumImprovement: 15,
    statisticalSignificance: 0.95,
    minimumSampleSize: 1000
  }
});

// Analyze test results
const analysis = abTestingFramework.analyzeTest(testId);
console.log('Winner:', analysis.winner);
console.log('Confidence:', analysis.confidence);
console.log('Recommendation:', analysis.recommendation);
```

## Performance Alerts

### `usePerformanceAlerts()` Hook

React hook for performance alert management.

```typescript
import { usePerformanceAlerts } from './utils/performanceAlerts';

function PerformanceMonitor() {
  const {
    processMetric,
    getAlerts,
    acknowledgeAlert,
    resolveAlert,
    getStats
  } = usePerformanceAlerts();

  // Process performance metrics
  const handleMetric = (metric: string, value: number) => {
    processMetric(metric, value, {
      environment: 'production',
      userId: 'user123',
      page: window.location.pathname
    });
  };

  // Get active alerts
  const activeAlerts = getAlerts('active');
  const stats = getStats(24); // Last 24 hours

  return (
    <div>
      <h3>Performance Alerts ({activeAlerts.length})</h3>
      {activeAlerts.map(alert => (
        <div key={alert.id}>
          <h4>{alert.title}</h4>
          <p>{alert.description}</p>
          <button onClick={() => acknowledgeAlert(alert.id)}>
            Acknowledge
          </button>
          <button onClick={() => resolveAlert(alert.id)}>
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Alert Rule Management

```typescript
import { performanceAlertManager } from './utils/performanceAlerts';

// Create alert rule
const ruleId = performanceAlertManager.createRule({
  name: 'High Bundle Size Alert',
  description: 'Alert when bundle size exceeds 1MB',
  metric: 'bundleSize',
  condition: 'greater_than',
  threshold: 1000, // KB
  severity: 'high',
  enabled: true,
  cooldown: 30, // minutes
  actions: [{
    id: 'slack-notification',
    type: 'slack',
    config: {
      webhookUrl: 'https://hooks.slack.com/...',
      channel: '#performance-alerts'
    },
    executed: false
  }],
  filters: {
    environment: 'production'
  }
});

// Create notification channel
const channelId = performanceAlertManager.createChannel({
  name: 'Slack Alerts',
  type: 'slack',
  config: {
    webhookUrl: 'https://hooks.slack.com/...',
    channel: '#performance'
  },
  enabled: true
});
```

## Analytics

### `useAnalytics()` Hook

React hook for advanced analytics and performance tracking.

```typescript
import { useAnalytics } from './utils/advancedAnalytics';

function MyComponent() {
  const { trackEvent, trackPageView, trackPerformance, getDashboard } = useAnalytics();

  // Track page view
  useEffect(() => {
    trackPageView('/dashboard', {
      userId: user.id,
      source: 'navigation'
    });
  }, []);

  // Track user interactions
  const handleButtonClick = () => {
    trackEvent('button_click', 'interaction', {
      buttonId: 'signup',
      page: '/landing',
      userId: user.id
    });
  };

  // Track performance metrics
  const handlePerformanceMetric = (metric: string, value: number) => {
    trackPerformance(metric, value, 'ms', {
      page: window.location.pathname,
      userId: user.id
    });
  };

  // Get analytics dashboard
  const dashboard = getDashboard(24); // Last 24 hours
  console.log('Total users:', dashboard.overview.totalUsers);
  console.log('Avg load time:', dashboard.performance.avgLoadTime);

  return (
    <div>
      <button onClick={handleButtonClick}>
        Sign Up
      </button>
    </div>
  );
}
```

### Advanced Analytics

```typescript
import { advancedAnalytics } from './utils/advancedAnalytics';

// Track custom events
advancedAnalytics.trackEvent('feature_used', 'engagement', {
  feature: 'image_upload',
  userId: 'user123',
  timestamp: Date.now()
});

// Track performance metrics
advancedAnalytics.trackPerformance('custom_metric', 150, 'ms', {
  operation: 'data_processing',
  recordCount: 1000
});

// Get comprehensive dashboard
const dashboard = advancedAnalytics.getDashboard(7); // Last 7 days
console.log('Performance trends:', dashboard.trends.performance);
console.log('Top pages:', dashboard.topPages);
console.log('Error rates:', dashboard.errors);
```

## Error Boundaries

### `ErrorBoundary` Component

React error boundary for graceful error handling.

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      level="critical"
      onError={(error, errorInfo) => {
        console.error('Critical error:', error, errorInfo);
        // Send to error tracking service
      }}
    >
      <MyApp />
    </ErrorBoundary>
  );
}

// Component-level error boundary
function MyComponent() {
  return (
    <ErrorBoundary
      level="component"
      showDetails={import.meta.env.DEV}
      fallback={<div>Component failed to load</div>}
    >
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

### `withErrorBoundary()` HOC

Higher-order component for easy error boundary wrapping.

```typescript
import { withErrorBoundary } from './components/ErrorBoundary';

const SafeComponent = withErrorBoundary(MyComponent, {
  level: 'component',
  showDetails: true
});

// Use the wrapped component
<SafeComponent />
```

### `useErrorHandler()` Hook

```typescript
import { useErrorHandler } from './components/ErrorBoundary';

function MyComponent() {
  const { reportError } = useErrorHandler();

  const handleAsyncOperation = async () => {
    try {
      await riskyAsyncOperation();
    } catch (error) {
      reportError(error, 'async_operation_failed');
    }
  };

  return (
    <button onClick={handleAsyncOperation}>
      Perform Operation
    </button>
  );
}
```

## Bundle Analysis

### Bundle Analysis Tools

```typescript
import { bundleAnalyzer, performanceBudget } from './utils/bundleAnalyzer';

// Analyze bundle
const stats = await bundleAnalyzer.analyzeBundle();
console.log('Total size:', stats.totalSize);
console.log('Gzip size:', stats.gzipSize);

// Get largest chunks
const largestChunks = bundleAnalyzer.getLargestChunks(5);
console.log('Largest chunks:', largestChunks);

// Get duplicate modules
const duplicates = bundleAnalyzer.getDuplicateModules();
console.log('Duplicate modules:', duplicates);

// Get bundle health score
const score = bundleAnalyzer.getBundleHealthScore();
console.log('Bundle health score:', score);

// Get recommendations
const recommendations = bundleAnalyzer.getRecommendations();
console.log('Recommendations:', recommendations);

// Check performance budgets
const budgetResults = performanceBudget.checkBudgets(stats);
budgetResults.forEach(result => {
  console.log(`${result.type}: ${result.status} (${result.actual}/${result.budget})`);
});
```

### Performance Regression Detection

```typescript
import { usePerformanceRegression } from './utils/performanceRegression';

function PerformanceMonitor() {
  const {
    setBaseline,
    recordSnapshot,
    getAlerts,
    getPerformanceTrend,
    getRegressionSummary
  } = usePerformanceRegression();

  // Set performance baseline
  useEffect(() => {
    setBaseline({
      timestamp: new Date().toISOString(),
      metrics: {
        CLS: 0.05,
        FID: 80,
        LCP: 2000,
        FCP: 1500,
        TTFB: 600,
        loadTime: 2500,
        bundleSize: 800,
        gzipSize: 250
      },
      version: '1.0.0',
      commit: 'abc123',
      environment: 'production'
    });
  }, []);

  // Record performance snapshot
  const recordPerformance = () => {
    recordSnapshot({
      timestamp: new Date().toISOString(),
      metrics: {
        CLS: 0.08,
        FID: 90,
        LCP: 2200,
        FCP: 1600,
        TTFB: 650,
        loadTime: 2700,
        bundleSize: 850,
        gzipSize: 260
      },
      environment: 'production',
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: 'session123'
    });
  };

  // Get performance trends
  const trends = getPerformanceTrend('LCP', 7); // Last 7 days
  console.log('LCP trends:', trends);

  // Get regression summary
  const summary = getRegressionSummary();
  console.log('Active alerts:', summary.activeAlerts);
  console.log('Critical alerts:', summary.criticalAlerts);

  return (
    <div>
      <button onClick={recordPerformance}>
        Record Performance
      </button>
    </div>
  );
}
```

## Utility Functions

### Performance Utilities

```typescript
import { 
  formatMetricValue, 
  getPerformanceGrade,
  isPWA,
  isOnline,
  getConnectionInfo
} from './utils/performance';

// Format metric values
const formatted = formatMetricValue(1500, 'ms'); // "1500ms"

// Get performance grade
const grade = getPerformanceGrade(85); // "B"

// Check PWA status
const isPWAApp = isPWA(); // true/false

// Check online status
const online = isOnline(); // true/false

// Get connection info
const connection = getConnectionInfo();
console.log('Connection type:', connection?.effectiveType);
console.log('Download speed:', connection?.downlink);
```

### Image Optimization Utilities

```typescript
import {
  getImageAspectRatio,
  calculateOptimalDimensions,
  generateImagePlaceholder
} from './utils/imageOptimization';

// Calculate aspect ratio
const ratio = getImageAspectRatio(1200, 800); // 1.5

// Calculate optimal dimensions
const dimensions = calculateOptimalDimensions(1200, 800, 400, 300);
console.log(dimensions); // { width: 400, height: 267 }

// Generate placeholder
const placeholder = generateImagePlaceholder(400, 300, 'Loading...');
console.log(placeholder); // "data:image/png;base64,..."
```

This API reference provides comprehensive documentation for all performance optimization features in the Wassel platform. Use these APIs to implement, monitor, and optimize performance in your applications.