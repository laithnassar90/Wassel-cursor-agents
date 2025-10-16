import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  MapPin, 
  Navigation, 
  Shield, 
  AlertTriangle, 
  Phone, 
  Users,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import { useGPSTracking, LocationData, SafetyAlert, SafetyContact } from '../utils/gpsTracking';

interface GPSTrackingProps {
  tripId: string;
  userId: string;
  driverId?: string;
  onLocationUpdate?: (location: LocationData) => void;
  onSafetyAlert?: (alert: SafetyAlert) => void;
}

export function GPSTracking({ 
  tripId, 
  userId, 
  driverId, 
  onLocationUpdate, 
  onSafetyAlert 
}: GPSTrackingProps) {
  const {
    startTracking,
    stopTracking,
    triggerEmergencySOS,
    triggerPanicButton,
    getCurrentLocation,
    getActiveTrip,
    getSafetyAlerts,
    isTracking,
    addSafetyContact,
    getSafetyContacts
  } = useGPSTracking();

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [safetyContacts, setSafetyContacts] = useState<SafetyContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial data
    setCurrentLocation(getCurrentLocation());
    setActiveTrip(getActiveTrip());
    setSafetyAlerts(getSafetyAlerts());
    setSafetyContacts(getSafetyContacts());

    // Set up periodic updates
    const interval = setInterval(() => {
      setCurrentLocation(getCurrentLocation());
      setActiveTrip(getActiveTrip());
      setSafetyAlerts(getSafetyAlerts());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartTracking = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await startTracking(tripId, userId, driverId);
      setActiveTrip(getActiveTrip());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTracking = () => {
    stopTracking();
    setActiveTrip(null);
  };

  const handleEmergencySOS = () => {
    try {
      const alertId = triggerEmergencySOS();
      console.log('Emergency SOS triggered:', alertId);
      // Refresh alerts
      setSafetyAlerts(getSafetyAlerts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger emergency SOS');
    }
  };

  const handlePanicButton = () => {
    try {
      const alertId = triggerPanicButton();
      console.log('Panic button triggered:', alertId);
      // Refresh alerts
      setSafetyAlerts(getSafetyAlerts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger panic button');
    }
  };

  const getLocationAccuracy = (accuracy: number) => {
    if (accuracy < 10) return { text: 'Excellent', color: 'text-green-600' };
    if (accuracy < 50) return { text: 'Good', color: 'text-yellow-600' };
    if (accuracy < 100) return { text: 'Fair', color: 'text-orange-600' };
    return { text: 'Poor', color: 'text-red-600' };
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      case 'panic': return <Shield className="h-4 w-4" />;
      case 'deviation': return <Navigation className="h-4 w-4" />;
      case 'delay': return <Clock className="h-4 w-4" />;
      case 'safety_check': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Tracking Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                GPS Tracking & Safety
              </CardTitle>
              <CardDescription>
                Real-time location tracking with safety features
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isTracking() ? (
                <Badge className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Tracking Active
                </Badge>
              ) : (
                <Badge variant="outline">Not Tracking</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Location */}
          {currentLocation && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Current Location</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="ml-2 font-mono">{currentLocation.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="ml-2 font-mono">{currentLocation.longitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className={`ml-2 ${getLocationAccuracy(currentLocation.accuracy).color}`}>
                    {Math.round(currentLocation.accuracy)}m ({getLocationAccuracy(currentLocation.accuracy).text})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Speed:</span>
                  <span className="ml-2">
                    {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)} km/h` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trip Information */}
          {activeTrip && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Trip Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Trip ID:</span>
                  <span className="ml-2 font-mono text-xs">{activeTrip.tripId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="ml-2" variant="outline">
                    {activeTrip.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2">
                    {Math.round((Date.now() - new Date(activeTrip.startTime).getTime()) / 60000)} min
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Route Points:</span>
                  <span className="ml-2">{activeTrip.route.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isTracking() ? (
              <Button 
                onClick={handleStartTracking} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Tracking
              </Button>
            ) : (
              <Button 
                onClick={handleStopTracking}
                variant="outline"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Tracking
              </Button>
            )}
          </div>

          {/* Emergency Buttons */}
          {isTracking() && (
            <div className="flex gap-2">
              <Button 
                onClick={handleEmergencySOS}
                variant="destructive"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency SOS
              </Button>
              <Button 
                onClick={handlePanicButton}
                variant="outline"
                className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Panic Button
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Safety Alerts ({safetyAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safetyAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{alert.message}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Location: {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {alert.acknowledged ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contacts ({safetyContacts.length})
          </CardTitle>
          <CardDescription>
            These contacts will be notified in case of emergency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safetyContacts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No emergency contacts added</p>
              <p className="text-sm">Add contacts in settings for emergency notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {safetyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {contact.phone} • {contact.relationship}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.isPrimary && (
                      <Badge variant="outline" className="text-xs">
                        Primary
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Location History
            </CardTitle>
            <CardDescription>
              Recent location updates and tracking data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="ml-2">
                  {currentLocation ? new Date(currentLocation.timestamp).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Tracking Status:</span>
                <span className={`ml-2 ${isTracking() ? 'text-green-600' : 'text-gray-500'}`}>
                  {isTracking() ? 'Active' : 'Inactive'}
                </span>
              </div>
              {activeTrip && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Route Points:</span>
                  <span className="ml-2">{activeTrip.route.length} locations recorded</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}