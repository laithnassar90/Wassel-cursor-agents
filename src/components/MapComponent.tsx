import { useEffect, useRef, useState } from 'react';

// Load Leaflet CSS dynamically
if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
}

interface MapLocation {
  lat: number;
  lng: number;
  label: string;
  type: 'start' | 'stop' | 'destination' | 'current';
}

interface MapComponentProps {
  locations: MapLocation[];
  showRoute?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

export function MapComponent({ 
  locations, 
  showRoute = true, 
  center, 
  zoom = 10,
  height = '400px',
  className = '' 
}: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import leaflet to reduce initial bundle size
    import('leaflet').then((L) => {
      // Determine center based on locations if not provided
      const mapCenter = center || (locations.length > 0 
        ? [locations[0].lat, locations[0].lng] as [number, number]
        : [25.2048, 55.2708] as [number, number]); // Default: Dubai

      // Initialize map
      const map = L.map(mapContainerRef.current!).setView(mapCenter, zoom);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      setIsLoading(false);

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }).catch(error => {
      console.error('Failed to load map:', error);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0 || isLoading) return;

    import('leaflet').then((L) => {
      const map = mapRef.current;

      // Clear existing layers except tile layer
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Custom icons for different location types
      const createIcon = (type: string, color: string) => {
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-size: 14px;
                font-weight: bold;
              ">${type === 'start' ? 'A' : type === 'destination' ? 'B' : type === 'current' ? '●' : '◉'}</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      };

      const markers: any[] = [];
      const routePoints: [number, number][] = [];

      // Add markers for each location
      locations.forEach((loc, index) => {
        let iconColor = '#008080'; // Primary teal
        if (loc.type === 'destination') iconColor = '#880044'; // Accent burgundy
        if (loc.type === 'stop') iconColor = '#607D4B'; // Secondary olive green
        if (loc.type === 'current') iconColor = '#0ea5e9'; // Blue for current location

        const marker = L.marker([loc.lat, loc.lng], {
          icon: createIcon(loc.type, iconColor)
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 150px;">
            <strong style="color: #008080;">${loc.label}</strong><br/>
            <small style="color: #6b7280;">${loc.type === 'start' ? 'Starting Point' : 
                                               loc.type === 'destination' ? 'Destination' :
                                               loc.type === 'current' ? 'Current Location' : 
                                               'Stop ' + index}</small>
          </div>
        `);

        markers.push(marker);
        routePoints.push([loc.lat, loc.lng]);
      });

      // Draw route if requested
      if (showRoute && routePoints.length > 1) {
        const polyline = L.polyline(routePoints, {
          color: '#008080',
          weight: 4,
          opacity: 0.7,
          smoothFactor: 1,
        }).addTo(map);

        // Fit map to show all markers
        const group = L.featureGroup([...markers, polyline]);
        map.fitBounds(group.getBounds().pad(0.1));
      } else if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    });
  }, [locations, showRoute, isLoading]);

  return (
    <div 
      style={{ height, width: '100%' }}
      className={`rounded-lg overflow-hidden border border-border ${className} relative`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }}
        className={isLoading ? 'opacity-0' : 'opacity-100'}
      />
    </div>
  );
}
