import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  Clock, 
  CloudRain, 
  Calendar, 
  MapPin, 
  Users, 
  Zap,
  Info,
  RefreshCw,
  Brain
} from 'lucide-react';
import { useAIPricing, PricingFactors, PricingResult } from '../utils/aiPricing';

interface DynamicPricingProps {
  distance: number;
  estimatedTime: number;
  pickupLocation: string;
  dropoffLocation: string;
  onPriceUpdate?: (price: PricingResult) => void;
}

export function DynamicPricing({ 
  distance, 
  estimatedTime, 
  pickupLocation, 
  dropoffLocation,
  onPriceUpdate 
}: DynamicPricingProps) {
  const { calculatePrice, getInsights } = useAIPricing();
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [factors, setFactors] = useState<PricingFactors>({
    demandLevel: 0.5,
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    isWeekend: [0, 6].includes(new Date().getDay()),
    availableDrivers: 15,
    driverToPassengerRatio: 0.6,
    weather: {
      temperature: 22,
      condition: 'sunny',
      severity: 0.1
    },
    location: {
      isAirport: pickupLocation.toLowerCase().includes('airport'),
      isDowntown: pickupLocation.toLowerCase().includes('downtown'),
      isEventArea: false,
      trafficLevel: 0.3
    },
    events: {
      hasEvent: false,
      eventType: 'none',
      eventSize: 0,
      eventDistance: 0
    },
    historical: {
      avgPrice: 12.50,
      priceVolatility: 0.2,
      seasonalFactor: 0.1
    }
  });

  useEffect(() => {
    calculatePricing();
    loadInsights();
  }, [distance, estimatedTime, factors]);

  const calculatePricing = async () => {
    setIsLoading(true);
    try {
      const result = calculatePrice(factors, distance, estimatedTime);
      setPricing(result);
      onPriceUpdate?.(result);
    } catch (error) {
      console.error('Pricing calculation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const pricingInsights = getInsights(24);
      setInsights(pricingInsights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const refreshPricing = () => {
    calculatePricing();
  };

  const getSurgeColor = (multiplier: number) => {
    if (multiplier <= 1.2) return 'text-green-600';
    if (multiplier <= 1.5) return 'text-yellow-600';
    if (multiplier <= 2.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSurgeBadge = (multiplier: number) => {
    if (multiplier <= 1.2) return { text: 'Normal', color: 'bg-green-100 text-green-800' };
    if (multiplier <= 1.5) return { text: 'Slight Surge', color: 'bg-yellow-100 text-yellow-800' };
    if (multiplier <= 2.0) return { text: 'Moderate Surge', color: 'bg-orange-100 text-orange-800' };
    return { text: 'High Surge', color: 'bg-red-100 text-red-800' };
  };

  if (!pricing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Calculating dynamic pricing...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const surgeBadge = getSurgeBadge(pricing.surgeMultiplier);

  return (
    <div className="space-y-4">
      {/* Main Pricing Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Dynamic Pricing
              </CardTitle>
              <CardDescription>
                Real-time pricing based on demand, weather, and events
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={surgeBadge.color}>
                {surgeBadge.text}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPricing}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Display */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              ${pricing.finalPrice.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {pricing.surgeMultiplier > 1 && (
                <span className={getSurgeColor(pricing.surgeMultiplier)}>
                  {Math.round((pricing.surgeMultiplier - 1) * 100)}% surge pricing
                </span>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Price Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Base fare</span>
                <span>${pricing.priceBreakdown.baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Distance ({distance.toFixed(1)} km)</span>
                <span>${pricing.priceBreakdown.distanceFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Time ({Math.round(estimatedTime)} min)</span>
                <span>${pricing.priceBreakdown.timeFare.toFixed(2)}</span>
              </div>
              {pricing.priceBreakdown.surgeFare > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Surge pricing</span>
                  <span>+${pricing.priceBreakdown.surgeFare.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>AI Confidence</span>
              <span>{Math.round(pricing.confidence * 100)}%</span>
            </div>
            <Progress value={pricing.confidence * 100} className="h-2" />
          </div>

          {/* Reasoning */}
          {pricing.reasoning.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Why this price?</h4>
              <div className="space-y-1">
                {pricing.reasoning.map((reason, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {pricing.recommendations.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {pricing.recommendations.map((rec, index) => (
                    <div key={index}>{rec}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pricing Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Demand Level
              </div>
              <div className="flex items-center gap-2">
                <Progress value={factors.demandLevel * 100} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(factors.demandLevel * 100)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Time
              </div>
              <div className="text-xs text-muted-foreground">
                {factors.timeOfDay}:00 {factors.isWeekend ? '(Weekend)' : '(Weekday)'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CloudRain className="h-4 w-4" />
                Weather
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {factors.weather.condition} ({factors.weather.temperature}°C)
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Drivers Available
              </div>
              <div className="text-xs text-muted-foreground">
                {factors.availableDrivers} drivers
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <div className="text-xs text-muted-foreground">
                {factors.location.isAirport ? 'Airport' : 
                 factors.location.isDowntown ? 'Downtown' : 'Regular area'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Events
              </div>
              <div className="text-xs text-muted-foreground">
                {factors.events.hasEvent ? factors.events.eventType : 'No events'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Insights</CardTitle>
            <CardDescription>Last 24 hours pricing trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {insights.avgSurgeMultiplier.toFixed(1)}x
                </div>
                <div className="text-xs text-muted-foreground">Avg Surge</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(insights.revenueImpact * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Revenue Impact</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(insights.priceVolatility * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Volatility</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insights.peakSurgeTimes.length}
                </div>
                <div className="text-xs text-muted-foreground">Peak Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}