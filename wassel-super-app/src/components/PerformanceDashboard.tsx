import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  performanceMonitor, 
  usePerformanceMonitoring, 
  formatMetricValue, 
  getPerformanceGrade,
  type PerformanceMetrics 
} from '../utils/performance';
import { Activity, Zap, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export function PerformanceDashboard() {
  const { 
    getMetrics, 
    getPerformanceScore, 
    getRecommendations, 
    startMonitoring, 
    stopMonitoring,
    clearMetrics 
  } = usePerformanceMonitoring();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Start monitoring on mount
    startMonitoring();
    setIsMonitoring(true);
    
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 5000);

    return () => {
      clearInterval(interval);
      stopMonitoring();
      setIsMonitoring(false);
    };
  }, []);

  const score = getPerformanceScore();
  const grade = getPerformanceGrade(score);
  const recommendations = getRecommendations();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getMetricStatus = (value: number | null, good: number, needsImprovement: number) => {
    if (value === null) return { status: 'unknown', color: 'gray' };
    if (value <= good) return { status: 'good', color: 'green' };
    if (value <= needsImprovement) return { status: 'needs-improvement', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your app's performance metrics and Core Web Vitals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoring" : "Stopped"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (isMonitoring) {
                stopMonitoring();
                setIsMonitoring(false);
              } else {
                startMonitoring();
                setIsMonitoring(true);
              }
            }}
          >
            {isMonitoring ? "Stop" : "Start"} Monitoring
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              clearMetrics();
              setMetrics(getMetrics());
            }}
          >
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Score
          </CardTitle>
          <CardDescription>
            Overall performance rating based on Core Web Vitals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className={`text-6xl font-bold ${getScoreColor(score)} ${getScoreBgColor(score)} rounded-full w-24 h-24 flex items-center justify-center`}>
              {grade}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Score: {score}/100</span>
                <span className="text-sm text-muted-foreground">{grade} Grade</span>
              </div>
              <Progress value={score} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {score >= 90 ? "Excellent performance!" : 
                 score >= 80 ? "Good performance with room for improvement" : 
                 "Performance needs attention"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Cumulative Layout Shift (CLS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A'}
            </div>
            <Badge 
              variant={
                getMetricStatus(metrics.CLS, 0.1, 0.25).color === 'green' ? 'default' :
                getMetricStatus(metrics.CLS, 0.1, 0.25).color === 'yellow' ? 'secondary' : 'destructive'
              }
            >
              {getMetricStatus(metrics.CLS, 0.1, 0.25).status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Good: ≤0.1, Needs Improvement: ≤0.25
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              First Input Delay (FID)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.FID ? formatMetricValue(metrics.FID) : 'N/A'}
            </div>
            <Badge 
              variant={
                getMetricStatus(metrics.FID, 100, 300).color === 'green' ? 'default' :
                getMetricStatus(metrics.FID, 100, 300).color === 'yellow' ? 'secondary' : 'destructive'
              }
            >
              {getMetricStatus(metrics.FID, 100, 300).status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Good: ≤100ms, Needs Improvement: ≤300ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Largest Contentful Paint (LCP)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.LCP ? formatMetricValue(metrics.LCP) : 'N/A'}
            </div>
            <Badge 
              variant={
                getMetricStatus(metrics.LCP, 2500, 4000).color === 'green' ? 'default' :
                getMetricStatus(metrics.LCP, 2500, 4000).color === 'yellow' ? 'secondary' : 'destructive'
              }
            >
              {getMetricStatus(metrics.LCP, 2500, 4000).status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Good: ≤2.5s, Needs Improvement: ≤4.0s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">First Contentful Paint</span>
              <span className="text-sm">{metrics.FCP ? formatMetricValue(metrics.FCP) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Time to First Byte</span>
              <span className="text-sm">{metrics.TTFB ? formatMetricValue(metrics.TTFB) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Load Time</span>
              <span className="text-sm">{metrics.loadTime ? formatMetricValue(metrics.loadTime) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">DOM Content Loaded</span>
              <span className="text-sm">{metrics.domContentLoaded ? formatMetricValue(metrics.domContentLoaded) : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Resource Count</span>
              <span className="text-sm">{metrics.resourceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Resource Size</span>
              <span className="text-sm">{(metrics.resourceSize / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Navigation Start</span>
              <span className="text-sm">{formatMetricValue(metrics.navigationStart)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Navigation End</span>
              <span className="text-sm">{formatMetricValue(metrics.navigationEnd)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Performance Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions to improve your app's performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {recommendations.length === 0 && score >= 90 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Excellent! Your app is performing well.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}