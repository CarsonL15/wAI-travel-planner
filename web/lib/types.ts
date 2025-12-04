// =============================================================================
// Trip Planning Types
// =============================================================================

/**
 * A single destination in a multi-destination trip
 */
export interface TripDestination {
  id: string;                      // Unique ID for drag-drop
  name: string;                    // "Paris", "Rome", etc.
  nights: number;                  // Duration at this stop
  order: number;                   // Position in route (0-indexed)
  coordinates?: [number, number];  // [lng, lat] for map
}

/**
 * Budget levels for trip planning
 */
export type BudgetLevel = 'budget' | 'moderate' | 'comfortable' | 'luxury';

/**
 * Pace levels for trip planning - how packed each day should be
 */
export type PaceLevel = 'relaxed' | 'moderate' | 'packed';

/**
 * Trip status
 */
export type TripStatus = 'planning' | 'generated' | 'archived';

/**
 * Main trip object
 */
export interface Trip {
  id: string;
  userId: string;
  name: string;                    // "Italian Adventure"
  startDate: string;               // ISO date
  budget: BudgetLevel;
  travelers: number;
  destinations: TripDestination[];
  totalNights: number;             // Computed sum
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Generated Itinerary Types
// =============================================================================

/**
 * Activity category
 */
export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'outdoor'
  | 'culture'
  | 'shopping'
  | 'relaxation'
  | 'nightlife'
  | 'other';

/**
 * Cost level for activities
 */
export type CostLevel = 'free' | 'low' | 'medium' | 'high';

/**
 * A single activity in a day's itinerary
 */
export interface Activity {
  id: string;
  time: string;                    // "09:00"
  endTime: string;                 // "11:30"
  title: string;
  description: string;
  category: ActivityCategory;
  location: string;
  coordinates?: [number, number];
  estimatedCost: CostLevel;
  tips?: string;
}

/**
 * Meal recommendation
 */
export interface MealRecommendation {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  cuisine: string;
  neighborhood: string;
  priceRange: string;              // "$15-25"
  description: string;
  mustTry?: string;                // Signature dish to try
}

/**
 * A single day's plan
 */
export interface DayPlan {
  date: string;
  dayNumber: number;               // Day 1, Day 2, etc. within this destination
  activities: Activity[];
  meals: MealRecommendation[];
}

/**
 * Accommodation type
 */
export type AccommodationType = 'hotel' | 'hostel' | 'apartment' | 'resort' | 'boutique';

/**
 * Accommodation recommendation for a destination
 */
export interface AccommodationRecommendation {
  type: AccommodationType;
  priceRange: string;              // "$100-150/night"
  neighborhood: string;            // "Le Marais"
  suggestion: string;              // Brief recommendation text
  amenities?: string[];            // ["Free WiFi", "Pool", etc.]
}

/**
 * Transport mode between destinations
 */
export type TransportMode = 'flight' | 'train' | 'bus' | 'car';

/**
 * Transport information between destinations
 */
export interface TransportInfo {
  mode: TransportMode;
  duration: string;                // "2h 30m"
  distance?: string;               // "450 km"
  estimatedCost: string;           // "$50-80"
  notes?: string;                  // Additional tips
}

/**
 * Complete itinerary for a single destination
 */
export interface DestinationItinerary {
  destinationId: string;
  name: string;
  arrivalDate: string;
  departureDate: string;
  accommodation: AccommodationRecommendation;
  days: DayPlan[];
  transportToNext?: TransportInfo; // null for last destination
}

/**
 * Complete generated itinerary for entire trip
 */
export interface GeneratedItinerary {
  tripId: string;
  destinations: DestinationItinerary[];
  packingList: string[];
  travelTips: string[];
  generatedAt: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Request to create a new trip
 */
export interface CreateTripRequest {
  name: string;
  startDate: string;
  budget: BudgetLevel;
  travelers: number;
  destinations: Array<{
    name: string;
    nights: number;
  }>;
}

/**
 * Request to update trip destinations
 */
export interface UpdateTripRequest {
  name?: string;
  startDate?: string;
  budget?: BudgetLevel;
  travelers?: number;
  destinations?: TripDestination[];
}

/**
 * Request to generate itinerary
 */
export interface GenerateItineraryRequest {
  tripId: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Geocoding result from Mapbox
 */
export interface GeocodingResult {
  name: string;
  coordinates: [number, number];   // [lng, lat]
  country?: string;
  region?: string;
}

/**
 * Map marker for RouteMap
 */
export interface MapMarker {
  id: string;
  coordinates: [number, number];
  label: string;
  order: number;
}

/**
 * Route leg data for displaying on map
 */
export interface RouteLeg {
  fromId: string;
  toId: string;
  mode: TransportMode;
  geometry: GeoJSON.LineString | null;
  duration: number; // in minutes
  durationText: string;
  distance: number; // in km
  isEstimate: boolean;
}

// =============================================================================
// Calendar Editor Types
// =============================================================================

/**
 * Activity in the calendar editor with positioning info
 */
export interface CalendarActivity {
  id: string;
  dayIndex: number;              // Which day (0-indexed)
  startTime: string;             // "09:00" (24h format)
  endTime: string;               // "11:30"
  title: string;
  description: string;
  category: ActivityCategory;
  location: string;
  estimatedCost: CostLevel;
  isCustom: boolean;             // User-created vs AI-generated
}

/**
 * A single day in the calendar
 */
export interface CalendarDay {
  date: string;                  // "2025-01-15"
  destinationName: string;       // "Paris"
  activities: CalendarActivity[];
}

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  days: CalendarDay[];           // Snapshot of state
  timestamp: number;
}

/**
 * Complete calendar state
 */
export interface CalendarState {
  days: CalendarDay[];
  currentWeekStart: number;      // Index of first visible day
  selectedActivityId: string | null;
  draggedActivityId: string | null;
  history: HistoryEntry[];       // For undo/redo
  historyIndex: number;
}
