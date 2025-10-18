import React, { useEffect, useState } from 'react';
import { useABTest } from '../utils/abTesting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  BarChart3, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface ABTestComponentProps {
  testId: string;
  children: (variant: string, config: unknown) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function ABTestComponent({ testId, children, fallback }: ABTestComponentProps) {
  const { test, variantId, assignUser, recordEvent, isAssigned } = useABTest(testId);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAssigned && test) {
      assignUser();
    }
    setIsLoading(false);
  }, [test, isAssigned, assignUser]);

  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  if (!test || !variantId) {
    return fallback || <div>Test not available</div>;
  }

  const variant = test.variants.find(v => v.id === variantId);
  if (!variant) {
    return fallback || <div>Variant not found</div>;
  }

  // Record view event
  useEffect(() => {
    recordEvent('view', { variantId, testId });
  }, [variantId, testId, recordEvent]);

  return <>{children(variantId, variant.config)}</>;
}

// A/B Test Dashboard Component
export function ABTestDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    // Load tests from framework
    import('../utils/abTesting').then(({ abTestingFramework }) => {
      const testList = Array.from(abTestingFramework.tests.values());
      setTests(testList);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-100 text-green-800">Running</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your performance optimization experiments
          </p>
        </div>
        <Button onClick={() => setSelectedTest('new')}>
          <Target className="h-4 w-4 mr-2" />
          Create New Test
        </Button>
      </div>

      {/* Test List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {test.description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Traffic Allocation</span>
                  <span className="font-medium">{Math.round(test.trafficAllocation * 100)}%</span>
                </div>
                <Progress value={test.trafficAllocation * 100} className="h-2" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Variants</span>
                  <span className="font-medium">{test.variants.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Primary Metric</span>
                  <span className="font-medium">{test.successCriteria.primaryMetric}</span>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedTest(test.id)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tests.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No A/B Tests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first A/B test to start optimizing performance
              </p>
              <Button onClick={() => setSelectedTest('new')}>
                <Target className="h-4 w-4 mr-2" />
                Create First Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Details Modal */}
      {selectedTest && (
        <TestDetailsModal 
          testId={selectedTest} 
          onClose={() => setSelectedTest(null)} 
        />
      )}
    </div>
  );
}

// Test Details Modal Component
function TestDetailsModal({ testId, onClose }: { testId: string; onClose: () => void }) {
  const [test, setTest] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (testId === 'new') {
      // Handle new test creation
      return;
    }

    // Load test details
    const { abTestingFramework: framework } = await import('../utils/abTesting');
    const testData = framework.getTest(testId);
    setTest(testData);

    if (testData) {
      const analysisData = framework.analyzeTest(testId);
      setAnalysis(analysisData);
    }
  }, [testId]);

  if (!test) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading test details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{test.name}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{test.variants.length}</div>
              <div className="text-sm text-muted-foreground">Variants</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(test.trafficAllocation * 100)}%</div>
              <div className="text-sm text-muted-foreground">Traffic</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{test.metrics.length}</div>
              <div className="text-sm text-muted-foreground">Metrics</div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <h3 className="text-lg font-medium mb-4">Variants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {test.variants.map((variant: any) => (
                <Card key={variant.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{variant.name}</CardTitle>
                    <CardDescription className="text-sm">{variant.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Traffic Weight</span>
                        <span>{Math.round(variant.trafficWeight * 100)}%</span>
                      </div>
                      <Progress value={variant.trafficWeight * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div>
              <h3 className="text-lg font-medium mb-4">Analysis Results</h3>
              <div className="space-y-4">
                {analysis.winner && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Winner:</strong> {analysis.winner} (Confidence: {Math.round(analysis.confidence * 100)}%)
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(analysis.variantResults.entries()).map(([variantId, data]: [string, any]) => (
                    <Card key={variantId}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{data.variant.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sample Size</span>
                          <span>{data.sampleSize}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Conversion Rate</span>
                          <span>{Math.round(data.conversionRate * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Significance</span>
                          <span>{Math.round(data.statisticalSignificance * 100)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {test.status === 'running' && (
              <Button variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Pause Test
              </Button>
            )}
            {test.status === 'paused' && (
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Resume Test
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}