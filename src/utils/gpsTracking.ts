// Real-time GPS Tracking and Safety Features

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface TripTracking {
  tripId: string;
  userId: string;
  driverId?: string;
  startLocation: LocationData;
  endLocation?: LocationData;
  currentLocation: LocationData;
  route: LocationData[];
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  estimatedArrival?: string;
  safetyAlerts: SafetyAlert[];
}

export interface SafetyAlert {
  id: string;
  type: 'emergency' | 'panic' | 'deviation' | 'delay' | 'safety_check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: LocationData;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface SafetyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: 'family' | 'friend' | 'emergency' | 'other';
  isPrimary: boolean;
}

export interface EmergencyResponse {
  alertId: string;
  responseType: 'police' | 'medical' | 'fire' | 'custom';
  contactInfo: string;
  estimatedResponseTime: number;
  status: 'dispatched' | 'en_route' | 'arrived' | 'resolved';
  timestamp: string;
}

export class GPSTrackingService {
  private static instance: GPSTrackingService;
  private watchId: number | null = null;
  private currentLocation: LocationData | null = null;
  private activeTrip: TripTracking | null = null;
  private safetyContacts: SafetyContact[] = [];
  private emergencyResponses: Map<string, EmergencyResponse> = new Map();
  private locationHistory: LocationData[] = [];
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadSafetyContacts();
    this.loadLocationHistory();
  }

  public static getInstance(): GPSTrackingService {
    if (!GPSTrackingService.instance) {
      GPSTrackingService.instance = new GPSTrackingService();
    }
    return GPSTrackingService.instance;
  }

  // Core GPS Tracking
  public async startTracking(tripId: string, userId: string, driverId?: string): Promise<void> {
    if (this.isTracking) {
      throw new Error('Tracking already in progress');
    }

    try {
      // Request location permission
      const permission = await this.requestLocationPermission();
      if (!permission) {
        throw new Error('Location permission denied');
      }

      // Get initial location
      const initialLocation = await this.getCurrentLocation();
      if (!initialLocation) {
        throw new Error('Unable to get current location');
      }

      // Initialize trip tracking
      this.activeTrip = {
        tripId,
        userId,
        driverId,
        startLocation: initialLocation,
        currentLocation: initialLocation,
        route: [initialLocation],
        status: 'in_progress',
        startTime: new Date().toISOString(),
        safetyAlerts: []
      };

      // Start continuous tracking
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.updateLocation(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

      // Start periodic safety checks
      this.trackingInterval = setInterval(() => {
        this.performSafetyChecks();
      }, 30000); // Check every 30 seconds

      this.isTracking = true;
      this.saveActiveTrip();

    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  }

  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.activeTrip) {
      this.activeTrip.status = 'completed';
      this.activeTrip.endTime = new Date().toISOString();
      this.activeTrip.endLocation = this.currentLocation || undefined;
      this.saveActiveTrip();
    }

    this.isTracking = false;
  }

  private async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: new Date().toISOString()
          };
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  }

  private updateLocation(position: GeolocationPosition): void {
    const location: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: new Date().toISOString()
    };

    this.currentLocation = location;
    this.locationHistory.push(location);

    // Keep only last 1000 locations
    if (this.locationHistory.length > 1000) {
      this.locationHistory = this.locationHistory.slice(-1000);
    }

    if (this.activeTrip) {
      this.activeTrip.currentLocation = location;
      this.activeTrip.route.push(location);
      this.saveActiveTrip();
    }

    this.saveLocationHistory();
  }

  private handleLocationError(error: GeolocationPositionError): void {
    console.error('Location error:', error);
    
    const alert: SafetyAlert = {
      id: `location_error_${Date.now()}`,
      type: 'safety_check',
      severity: 'medium',
      message: `Location tracking error: ${error.message}`,
      location: this.currentLocation || {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    this.createSafetyAlert(alert);
  }

  // Safety Features
  public createSafetyAlert(alert: Omit<SafetyAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): string {
    const safetyAlert: SafetyAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    if (this.activeTrip) {
      this.activeTrip.safetyAlerts.push(safetyAlert);
      this.saveActiveTrip();
    }

    // Send alert to emergency contacts
    this.notifyEmergencyContacts(safetyAlert);

    // Send to monitoring service
    this.sendToMonitoringService(safetyAlert);

    return safetyAlert.id;
  }

  public triggerEmergencySOS(): string {
    if (!this.currentLocation) {
      throw new Error('No current location available');
    }

    const alert: SafetyAlert = {
      id: `sos_${Date.now()}`,
      type: 'emergency',
      severity: 'critical',
      message: 'EMERGENCY SOS ACTIVATED - Immediate assistance required',
      location: this.currentLocation,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    const alertId = this.createSafetyAlert(alert);

    // Immediately notify all emergency contacts
    this.notifyEmergencyContacts(alert, true);

    // Send to emergency services
    this.sendToEmergencyServices(alert);

    return alertId;
  }

  public triggerPanicButton(): string {
    if (!this.currentLocation) {
      throw new Error('No current location available');
    }

    const alert: SafetyAlert = {
      id: `panic_${Date.now()}`,
      type: 'panic',
      severity: 'high',
      message: 'Panic button activated - User feels unsafe',
      location: this.currentLocation,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    return this.createSafetyAlert(alert);
  }

  private performSafetyChecks(): void {
    if (!this.activeTrip || !this.currentLocation) return;

    // Check for route deviation
    this.checkRouteDeviation();

    // Check for unusual delays
    this.checkForDelays();

    // Check for speed anomalies
    this.checkSpeedAnomalies();

    // Check for location accuracy
    this.checkLocationAccuracy();
  }

  private checkRouteDeviation(): void {
    if (!this.activeTrip || this.activeTrip.route.length < 2) return;

    const currentLocation = this.activeTrip.currentLocation;
    const lastLocation = this.activeTrip.route[this.activeTrip.route.length - 2];
    
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      lastLocation.latitude,
      lastLocation.longitude
    );

    // If moved more than 1km in 30 seconds, might be deviation
    const timeDiff = (new Date(currentLocation.timestamp).getTime() - 
                     new Date(lastLocation.timestamp).getTime()) / 1000;
    
    if (distance > 1 && timeDiff < 30) {
      const alert: SafetyAlert = {
        id: `deviation_${Date.now()}`,
        type: 'deviation',
        severity: 'medium',
        message: 'Unusual movement detected - possible route deviation',
        location: currentLocation,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      };

      this.createSafetyAlert(alert);
    }
  }

  private checkForDelays(): void {
    if (!this.activeTrip) return;

    const startTime = new Date(this.activeTrip.startTime).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);

    // If trip is taking longer than expected (assuming 30 min max)
    if (elapsedMinutes > 30) {
      const alert: SafetyAlert = {
        id: `delay_${Date.now()}`,
        type: 'delay',
        severity: 'low',
        message: `Trip is taking longer than expected (${Math.round(elapsedMinutes)} minutes)`,
        location: this.activeTrip.currentLocation,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      };

      this.createSafetyAlert(alert);
    }
  }

  private checkSpeedAnomalies(): void {
    if (!this.currentLocation || !this.currentLocation.speed) return;

    const speedKmh = this.currentLocation.speed * 3.6; // Convert m/s to km/h

    // Alert if speed is unusually high (>120 km/h) or low (<5 km/h for extended period)
    if (speedKmh > 120) {
      const alert: SafetyAlert = {
        id: `speed_high_${Date.now()}`,
        type: 'safety_check',
        severity: 'high',
        message: `High speed detected: ${Math.round(speedKmh)} km/h`,
        location: this.currentLocation,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      };

      this.createSafetyAlert(alert);
    }
  }

  private checkLocationAccuracy(): void {
    if (!this.currentLocation) return;

    // Alert if location accuracy is poor (>100m)
    if (this.currentLocation.accuracy > 100) {
      const alert: SafetyAlert = {
        id: `accuracy_${Date.now()}`,
        type: 'safety_check',
        severity: 'low',
        message: `Poor location accuracy: ${Math.round(this.currentLocation.accuracy)}m`,
        location: this.currentLocation,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      };

      this.createSafetyAlert(alert);
    }
  }

  // Emergency Contacts Management
  public addSafetyContact(contact: Omit<SafetyContact, 'id'>): string {
    const safetyContact: SafetyContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.safetyContacts.push(safetyContact);
    this.saveSafetyContacts();
    return safetyContact.id;
  }

  public removeSafetyContact(contactId: string): boolean {
    const index = this.safetyContacts.findIndex(c => c.id === contactId);
    if (index === -1) return false;

    this.safetyContacts.splice(index, 1);
    this.saveSafetyContacts();
    return true;
  }

  public getSafetyContacts(): SafetyContact[] {
    return [...this.safetyContacts];
  }

  private async notifyEmergencyContacts(alert: SafetyAlert, isUrgent: boolean = false): Promise<void> {
    const primaryContacts = this.safetyContacts.filter(c => c.isPrimary);
    const allContacts = isUrgent ? this.safetyContacts : primaryContacts;

    for (const contact of allContacts) {
      try {
        await this.sendEmergencyNotification(contact, alert);
      } catch (error) {
        console.error(`Failed to notify ${contact.name}:`, error);
      }
    }
  }

  private async sendEmergencyNotification(contact: SafetyContact, alert: SafetyAlert): Promise<void> {
    const message = `🚨 WASSEL SAFETY ALERT 🚨
    
${alert.message}

Location: ${alert.location.latitude}, ${alert.location.longitude}
Time: ${new Date(alert.timestamp).toLocaleString()}
Alert ID: ${alert.id}

View on map: https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`;

    // In a real implementation, send SMS/email
    console.log(`Sending emergency notification to ${contact.name} (${contact.phone}):`, message);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendToEmergencyServices(alert: SafetyAlert): Promise<void> {
    const emergencyData = {
      alertId: alert.id,
      location: alert.location,
      timestamp: alert.timestamp,
      message: alert.message,
      contactInfo: this.safetyContacts.filter(c => c.isPrimary).map(c => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship
      }))
    };

    // In a real implementation, send to emergency services API
    console.log('Sending to emergency services:', emergencyData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendToMonitoringService(alert: SafetyAlert): Promise<void> {
    // Send to internal monitoring system
    console.log('Sending to monitoring service:', alert);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Utility Functions
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private async requestLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) {
      return true; // Assume granted if permissions API not available
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Permission check failed:', error);
      return true; // Assume granted if check fails
    }
  }

  // Data Management
  public getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  public getActiveTrip(): TripTracking | null {
    return this.activeTrip;
  }

  public getLocationHistory(): LocationData[] {
    return [...this.locationHistory];
  }

  public getSafetyAlerts(): SafetyAlert[] {
    return this.activeTrip?.safetyAlerts || [];
  }

  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Persistence
  private loadSafetyContacts(): void {
    try {
      const data = localStorage.getItem('safety_contacts');
      if (data) {
        this.safetyContacts = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load safety contacts:', error);
    }
  }

  private saveSafetyContacts(): void {
    try {
      localStorage.setItem('safety_contacts', JSON.stringify(this.safetyContacts));
    } catch (error) {
      console.warn('Failed to save safety contacts:', error);
    }
  }

  private loadLocationHistory(): void {
    try {
      const data = localStorage.getItem('location_history');
      if (data) {
        this.locationHistory = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load location history:', error);
    }
  }

  private saveLocationHistory(): void {
    try {
      localStorage.setItem('location_history', JSON.stringify(this.locationHistory));
    } catch (error) {
      console.warn('Failed to save location history:', error);
    }
  }

  private saveActiveTrip(): void {
    if (!this.activeTrip) return;

    try {
      localStorage.setItem('active_trip', JSON.stringify(this.activeTrip));
    } catch (error) {
      console.warn('Failed to save active trip:', error);
    }
  }
}

// React hook for GPS tracking
export function useGPSTracking() {
  const service = GPSTrackingService.getInstance();
  
  return {
    startTracking: (tripId: string, userId: string, driverId?: string) =>
      service.startTracking(tripId, userId, driverId),
    stopTracking: () => service.stopTracking(),
    triggerEmergencySOS: () => service.triggerEmergencySOS(),
    triggerPanicButton: () => service.triggerPanicButton(),
    getCurrentLocation: () => service.getCurrentLocation(),
    getActiveTrip: () => service.getActiveTrip(),
    getSafetyAlerts: () => service.getSafetyAlerts(),
    isTracking: () => service.isCurrentlyTracking(),
    addSafetyContact: (contact: Omit<SafetyContact, 'id'>) => service.addSafetyContact(contact),
    removeSafetyContact: (contactId: string) => service.removeSafetyContact(contactId),
    getSafetyContacts: () => service.getSafetyContacts()
  };
}

// Export singleton instance
export const gpsTrackingService = GPSTrackingService.getInstance();