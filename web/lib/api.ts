import { getIdToken, getFreshIdToken } from './auth';
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
  GeneratedItinerary,
  BudgetLevel,
} from './types';

// Remove trailing slash from API URL if present
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

async function fetchWithAuth(url: string, options: RequestInit = {}, timeoutMs: number = 120000) {
  // Get a fresh token (this will auto-refresh if expired)
  let token: string;
  try {
    token = await getFreshIdToken();
  } catch (err) {
    console.error('Failed to get fresh token:', err);
    throw new Error('Session expired. Please log in again.');
  }

  if (!API_URL) {
    throw new Error('API URL not configured. Check your .env.local file.');
  }

  const fullUrl = `${API_URL}${url}`;
  console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        ...options.headers,
      },
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    // Check if it was a timeout
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
    }
    // Network error, timeout, or CORS issue
    console.error('Fetch error:', fetchError);
    throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error response:', response.status, errorText);

    let error: { error?: string; message?: string };
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: response.statusText || `HTTP ${response.status}` };
    }

    throw new Error(error.error || error.message || `API request failed (${response.status})`);
  }

  try {
    return await response.json();
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error('Invalid response from server');
  }
}

// =============================================================================
// Legacy Itinerary API (for backwards compatibility)
// =============================================================================

export async function generateItinerary(data: {
  destination: string;
  duration: number;
  interests: string[];
  budget: string;
  startDate: string;
}) {
  return fetchWithAuth('/itineraries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getItinerary(id: string) {
  return fetchWithAuth(`/itineraries/${id}`);
}

// =============================================================================
// User API
// =============================================================================

export async function getUser() {
  return fetchWithAuth('/user');
}

// =============================================================================
// Multi-Destination Trip API
// =============================================================================

/**
 * Create a new trip
 */
export async function createTrip(data: CreateTripRequest): Promise<Trip> {
  return fetchWithAuth('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get all trips for the current user
 */
export async function getTrips(): Promise<Trip[]> {
  return fetchWithAuth('/trips');
}

/**
 * Get a specific trip by ID
 */
export async function getTrip(tripId: string): Promise<Trip> {
  return fetchWithAuth(`/trips/${tripId}`);
}

/**
 * Update a trip
 */
export async function updateTrip(
  tripId: string,
  data: UpdateTripRequest
): Promise<Trip> {
  return fetchWithAuth(`/trips/${tripId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  return fetchWithAuth(`/trips/${tripId}`, {
    method: 'DELETE',
  });
}

/**
 * Generate itinerary for a multi-destination trip
 */
export async function generateTripItinerary(
  tripId: string
): Promise<GeneratedItinerary> {
  return fetchWithAuth(`/trips/${tripId}/generate`, {
    method: 'POST',
  });
}

/**
 * Get the generated itinerary for a trip
 */
export async function getTripItinerary(
  tripId: string
): Promise<GeneratedItinerary> {
  return fetchWithAuth(`/trips/${tripId}/itinerary`);
}

// =============================================================================
// Quick Generate API (for multi-destination trips)
// =============================================================================

/**
 * Generate an itinerary for a multi-destination trip
 * Adapts the multi-destination format to the existing API format
 */
export async function generateQuickItinerary(data: {
  destinations: Array<{ name: string; nights: number }>;
  startDate: string;
  budget: BudgetLevel;
  travelers: number;
}): Promise<GeneratedItinerary> {
  // Combine destinations into a single string for the legacy API
  const destinationString = data.destinations.map(d => d.name).join(', ');
  const totalNights = data.destinations.reduce((sum, d) => sum + d.nights, 0);

  // Call the existing /itineraries endpoint with adapted data
  const response = await fetchWithAuth('/itineraries', {
    method: 'POST',
    body: JSON.stringify({
      destination: destinationString,
      duration: totalNights,
      interests: ['sightseeing', 'food', 'culture'], // Default interests
      budget: data.budget,
      startDate: data.startDate,
    }),
  });

  // Transform the response to match GeneratedItinerary format
  return transformLegacyResponse(response, data);
}

/**
 * Transform legacy API response to GeneratedItinerary format
 */
function transformLegacyResponse(
  response: any,
  originalData: {
    destinations: Array<{ name: string; nights: number }>;
    startDate: string;
    budget: BudgetLevel;
    travelers: number;
  }
): GeneratedItinerary {
  // The legacy API returns a different format, so we need to adapt it
  const destinations = originalData.destinations.map((dest, index) => {
    const startDate = new Date(originalData.startDate);
    // Calculate arrival date based on previous destinations
    const nightsBefore = originalData.destinations
      .slice(0, index)
      .reduce((sum, d) => sum + d.nights, 0);
    startDate.setDate(startDate.getDate() + nightsBefore);

    const departureDate = new Date(startDate);
    departureDate.setDate(departureDate.getDate() + dest.nights);

    // Create days for this destination
    const days = [];
    for (let i = 0; i < dest.nights; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      days.push({
        date: dayDate.toISOString().split('T')[0],
        dayNumber: i + 1,
        activities: response?.days?.[nightsBefore + i]?.blocks?.map((block: any) => ({
          id: `activity-${index}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          time: block.start || '09:00',
          endTime: block.end || '10:00',
          title: block.title || 'Activity',
          description: block.notes || '',
          category: block.category || 'sightseeing',
          location: block.address || dest.name,
          estimatedCost: block.costBand === 'high' ? 'high' : block.costBand === 'med' ? 'medium' : 'low',
        })) || [],
        meals: [],
      });
    }

    return {
      destinationId: `dest-${index}`,
      name: dest.name,
      arrivalDate: startDate.toISOString().split('T')[0],
      departureDate: departureDate.toISOString().split('T')[0],
      accommodation: {
        type: 'hotel' as const,
        priceRange: originalData.budget === 'luxury' ? '$200+/night' : originalData.budget === 'comfortable' ? '$100-200/night' : '$50-100/night',
        neighborhood: 'City Center',
        suggestion: `Recommended hotel in ${dest.name}`,
      },
      days,
      transportToNext: index < originalData.destinations.length - 1 ? {
        mode: 'train' as const,
        duration: '2-3h',
        estimatedCost: '$30-50',
      } : undefined,
    };
  });

  return {
    tripId: response?.id || 'preview',
    destinations,
    packingList: response?.packingList || [],
    travelTips: [],
    generatedAt: new Date().toISOString(),
  };
}
