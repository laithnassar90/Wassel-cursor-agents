import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  MapPin,
  Clock,
  Star,
  Zap,
  Shield,
  Target,
  PieChart,
  LineChart,
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAnalytics } from '../utils/advancedAnalytics';
import { useAIPricing } from '../utils/aiPricing';
import { useGPSTracking } from '../utils/gpsTracking';
import { useDigitalWallet } from '../utils/digitalWallet';
import { useLoyaltyProgram } from '../utils/loyaltyProgram';

interface AdvancedAnalyticsProps {
  userId: string;
  timeRange?: number; // days
}

export function AdvancedAnalytics({ userId, timeRange = 30 }: AdvancedAnalyticsProps) {
  const { getDashboard } = useAnalytics();
  const { getInsights } = useAIPricing();
  const { getSafetyAlerts } = useGPSTracking();
  const { getAnalytics: getWalletAnalytics } = useDigitalWallet();
  const { getAnalytics: getLoyaltyAnalytics } = useLoyaltyProgram();

  const [dashboard, setDashboard] = useState<any>(null);
  const [pricingInsights, setPricingInsights] = useState<any>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
  const [walletAnalytics, setWalletAnalytics] = useState<any>(null);
  const [loyaltyAnalytics, setLoyaltyAnalytics] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(timeRange);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [userId, selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load all analytics data
      const [
        dashboardData,
        pricingData,
        safetyData,
        walletData,
        loyaltyData
      ] = await Promise.all([
        getDashboard(selectedTimeRange),
        getInsights(selectedTimeRange),
        Promise.resolve(getSafetyAlerts()),
        Promise.resolve(getWalletAnalytics(userId)),
        Promise.resolve(getLoyaltyAnalytics(userId))
      ]);

      setDashboard(dashboardData);
      setPricingInsights(pricingData);
      setSafetyAlerts(safetyData);
      setWalletAnalytics(walletData);
      setLoyaltyAnalytics(loyaltyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    // Export analytics data
    const data = {
      dashboard,
      pricingInsights,
      safetyAlerts,
      walletAnalytics,
      loyaltyAnalytics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (isLoading && !dashboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin mr-2" />
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your ride sharing platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange.toString()} onValueChange={(value) => setSelectedTimeRange(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.overview.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.overview.sessions.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">${dashboard.overview.pageViews.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(dashboard.overview.avgSessionDuration / 60)}m</div>
                  <div className="text-sm text-muted-foreground">Avg Session</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.trends.users ? (
                  <div className="space-y-2">
                    {dashboard.trends.users.slice(-7).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{trend.date}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(trend.count / Math.max(...dashboard.trends.users.map((t: any) => t.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{trend.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No user growth data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.performance ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getPerformanceGrade(dashboard.performance.avgLoadTime).color}`}>
                        {getPerformanceGrade(dashboard.performance.avgLoadTime).grade}
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Performance</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Load Time</span>
                        <span>{dashboard.performance.avgLoadTime}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CLS</span>
                        <span>{dashboard.performance.avgCLS}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>LCP</span>
                        <span>{dashboard.performance.avgLCP}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>FID</span>
                        <span>{dashboard.performance.avgFID}ms</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.topPages && dashboard.topPages.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.topPages.slice(0, 5).map((page: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{page.page}</div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {page.avgLoadTime}ms
                        </div>
                      </div>
                      <Badge variant="outline">{page.views} views</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No page data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Core Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Core Web Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.performance ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Largest Contentful Paint (LCP)</span>
                        <span className={dashboard.performance.avgLCP <= 2500 ? 'text-green-600' : 'text-red-600'}>
                          {dashboard.performance.avgLCP}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((2500 / dashboard.performance.avgLCP) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>First Input Delay (FID)</span>
                        <span className={dashboard.performance.avgFID <= 100 ? 'text-green-600' : 'text-red-600'}>
                          {dashboard.performance.avgFID}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((100 / dashboard.performance.avgFID) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cumulative Layout Shift (CLS)</span>
                        <span className={dashboard.performance.avgCLS <= 0.1 ? 'text-green-600' : 'text-red-600'}>
                          {dashboard.performance.avgCLS}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((0.1 / dashboard.performance.avgCLS) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Core Web Vitals data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.trends.performance ? (
                  <div className="space-y-2">
                    {dashboard.trends.performance.slice(-7).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{trend.date}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((3000 / trend.loadTime) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{trend.loadTime}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance trends available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pricing Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pricingInsights ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {pricingInsights.avgSurgeMultiplier.toFixed(1)}x
                      </div>
                      <div className="text-sm text-muted-foreground">Average Surge</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Revenue Impact</span>
                        <span className="text-green-600">
                          +{Math.round(pricingInsights.revenueImpact * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Price Volatility</span>
                        <span>{Math.round(pricingInsights.priceVolatility * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Peak Hours</span>
                        <span>{pricingInsights.peakSurgeTimes.length}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pricing insights available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loyalty Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Loyalty Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loyaltyAnalytics ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {loyaltyAnalytics.currentTier.name}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Tier</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Points Earned</span>
                        <span>{loyaltyAnalytics.totalEarned.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Points Redeemed</span>
                        <span>{loyaltyAnalytics.totalRedeemed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available Rewards</span>
                        <span>{loyaltyAnalytics.availableRewards}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Points Multiplier</span>
                        <span>{loyaltyAnalytics.currentTier.multiplier}x</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No loyalty data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Safety Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safetyAlerts.length > 0 ? (
                <div className="space-y-3">
                  {safetyAlerts.slice(0, 10).map((alert: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-100' :
                          alert.severity === 'high' ? 'bg-orange-100' :
                          alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <Shield className={`h-4 w-4 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-orange-600' :
                            alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{alert.severity}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No safety alerts</p>
                  <p className="text-sm">All systems operating normally</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Wallet Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Wallet Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletAnalytics ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {walletAnalytics.totalTransactions}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Spent</span>
                        <span className="text-red-600">${walletAnalytics.totalSpent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Received</span>
                        <span className="text-green-600">${walletAnalytics.totalReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Transaction</span>
                        <span>${walletAnalytics.averageTransaction.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No wallet data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletAnalytics?.monthlyTrend ? (
                  <div className="space-y-2">
                    {walletAnalytics.monthlyTrend.slice(-6).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{trend.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(trend.received / Math.max(...walletAnalytics.monthlyTrend.map((t: any) => t.received))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">${trend.received.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No revenue trends available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading analytics: {error}</p>
              <Button variant="outline" onClick={handleRefresh} className="mt-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}