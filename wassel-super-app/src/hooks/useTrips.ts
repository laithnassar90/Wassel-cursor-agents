import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { logError } from '../utils/logger';
import type { Database } from '../utils/supabase/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];
type SearchTripResult = {
  trip_id: string;
  driver_name: string;
  distance_from_km: number;
  distance_to_km: number;
};

export function useTrips(filters?: {
  status?: string[];
  driverId?: string;
  fromDate?: string;
}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [filters]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('trips')
        .select(`
          *,
          driver:profiles!driver_id(
            id,
            full_name,
            avatar_url,
            rating_as_driver
          ),
          vehicle:vehicles(
            make,
            model,
            color,
            year
          ),
          stops:trip_stops(*)
        `)
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.driverId) {
        query = query.eq('driver_id', filters.driverId);
      }

      if (filters?.fromDate) {
        query = query.gte('departure_date', filters.fromDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTrips(data || []);
      setError(null);
    } catch (err: any) {
      logError('Error fetching trips', { error: err });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async (tripData: TripInsert) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) throw error;

      // Refresh trips list
      await fetchTrips();

      return { data, error: null };
    } catch (err: any) {
      logError('Error creating trip', { error: err });
      return { data: null, error: err.message };
    }
  };

  const updateTrip = async (tripId: string, updates: TripUpdate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();

      if (error) throw error;

      // Refresh trips list
      await fetchTrips();

      return { data, error: null };
    } catch (err: any) {
      logError('Error updating trip', { error: err });
      return { data: null, error: err.message };
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      // Refresh trips list
      await fetchTrips();

      return { error: null };
    } catch (err: any) {
      logError('Error deleting trip', { error: err });
      return { error: err.message };
    }
  };

  const publishTrip = async (tripId: string) => {
    return updateTrip(tripId, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
  };

  return {
    trips,
    loading,
    error,
    refresh: fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    publishTrip,
  };
}

// Hook for searching trips
export function useSearchTrips(searchParams: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  departureDate?: string;
  maxDistance?: number;
}) {
  const [trips, setTrips] = useState<SearchTripResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrips = async () => {
    try {
      setLoading(true);
      
      const { data, error: searchError } = await supabase.rpc('search_nearby_trips', {
        from_lat: searchParams.fromLat,
        from_lng: searchParams.fromLng,
        to_lat: searchParams.toLat,
        to_lng: searchParams.toLng,
        max_distance_km: searchParams.maxDistance || 10,
        departure_date: searchParams.departureDate || new Date().toISOString().split('T')[0],
      });

      if (searchError) throw searchError;

      setTrips((data as SearchTripResult[]) || []);
      setError(null);
    } catch (err: any) {
      logError('Error searching trips', { error: err });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    trips,
    loading,
    error,
    searchTrips,
  };
}

// Hook for a single trip with real-time updates
export function useTrip(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    fetchTrip();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Trip updated:', payload);
          if (payload.eventType === 'DELETE') {
            setTrip(null);
          } else {
            fetchTrip();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select(`
          *,
          driver:profiles!driver_id(*),
          vehicle:vehicles(*),
          stops:trip_stops(*),
          bookings(
            *,
            passenger:profiles!passenger_id(*)
          )
        `)
        .eq('id', tripId)
        .single();

      if (fetchError) throw fetchError;

      setTrip(data);
      setError(null);
    } catch (err: any) {
      logError('Error fetching trip', { error: err });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    trip,
    loading,
    error,
    refresh: fetchTrip,
  };
}
