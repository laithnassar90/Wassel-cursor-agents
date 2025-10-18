import { supabase } from '../utils/supabase/client';

// Get environment variables for API configuration
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || 'https://ncbwummxjmsfcreagnmz.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/make-server-cdfdab65`;
const publicAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnd1bW14am1zZmNyZWFnbm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODc3MDksImV4cCI6MjA3NDk2MzcwOX0.ulQqMZstbeqjxityaIpL3ySUWJgQlSi5cMgZPq1xKGY';

// Export the supabase client from the utils
export { supabase };

// Store auth token in memory
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// ============ AUTH API ============

export const authAPI = {
  async signUp(email: string, password: string, firstName: string, lastName: string, phone: string) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, firstName, lastName, phone })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return await response.json();
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (data.session) {
      setAuthToken(data.session.access_token);
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAuthToken(null);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) {
      setAuthToken(data.session.access_token);
    }
    return data;
  },

  async getProfile() {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  }
};

// ============ TRIPS API ============

type CreateTripPayload = {
  vehicle_id?: string | null;
  trip_type: 'wasel' | 'raje3';
  status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
  from_location: string;
  from_lat: number;
  from_lng: number;
  to_location: string;
  to_lat: number;
  to_lng: number;
  departure_date: string; // YYYY-MM-DD
  departure_time: string; // HH:MM:SS
  available_seats: number;
  price_per_seat: number;
  notes?: string | null;
  instant_booking?: boolean;
};

export const tripsAPI = {
  async createTrip(tripData: CreateTripPayload) {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tripData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create trip');
    }

    return await response.json();
  },

  async searchTrips(from?: string, to?: string, date?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (date) params.append('date', date);

    const response = await fetch(`${API_URL}/trips/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search trips');
    }

    return await response.json();
  },

  async getTripById(tripId: string) {
    const response = await fetch(`${API_URL}/trips/${tripId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trip');
    }

    return await response.json();
  },

  async getDriverTrips() {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/trips/driver`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch driver trips');
    }

    return await response.json();
  }
};

// ============ BOOKINGS API ============

export const bookingsAPI = {
  async createBooking(tripId: string, seatsBooked: number) {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tripId, seatsBooked })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create booking');
    }

    return await response.json();
  },

  async getUserBookings() {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/bookings/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    return await response.json();
  }
};

// ============ MESSAGES API ============

export const messagesAPI = {
  async sendMessage(recipientId: string, tripId: string, message: string) {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ recipientId, tripId, message })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  },

  async getConversations() {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return await response.json();
  }
};

// ============ WALLET API ============

export const walletAPI = {
  async getWallet() {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/wallet`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wallet');
    }

    return await response.json();
  },

  async addFunds(amount: number) {
    const token = authToken;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/wallet/add-funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    if (!response.ok) {
      throw new Error('Failed to add funds');
    }

    return await response.json();
  }
};
