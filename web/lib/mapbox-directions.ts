import type { TransportMode } from './types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: GeoJSON.LineString; // The actual route geometry
}

export interface RouteInfo {
  mode: TransportMode;
  distance: number; // in km
  duration: number; // in minutes
  durationText: string; // formatted string like "2h 30m"
  geometry: GeoJSON.LineString | null; // Route geometry for drawing on map
  isEstimate: boolean; // true for flights (no real route data)
}

// Map our transport modes to Mapbox profiles
const MAPBOX_PROFILES: Record<string, string> = {
  car: 'driving',
  bus: 'driving', // Use driving profile for bus (similar roads)
  train: 'driving', // Use driving profile for train (similar route on map)
  flight: 'flight', // We'll handle this specially
};

// Modes that can use Mapbox Directions API
const ROUTABLE_MODES = ['car', 'bus', 'train'];

/**
 * Fetch route from Mapbox Directions API
 */
async function fetchMapboxRoute(
  from: [number, number],
  to: [number, number],
  profile: string = 'driving'
): Promise<RouteData | null> {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured');
    return null;
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching Mapbox route:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
function calculateDistance(from: [number, number], to: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((to[1] - from[1]) * Math.PI) / 180;
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from[1] * Math.PI) / 180) *
      Math.cos((to[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a great circle arc for flight paths
 * This creates the curved line that flights actually follow
 */
function generateGreatCircleArc(
  from: [number, number],
  to: [number, number],
  numPoints: number = 100
): GeoJSON.LineString {
  const coordinates: [number, number][] = [];

  const lat1 = (from[1] * Math.PI) / 180;
  const lon1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const lon2 = (to[0] * Math.PI) / 180;

  // Calculate the angular distance
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
    )
  );

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;

    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);

    coordinates.push([
      (lon * 180) / Math.PI,
      (lat * 180) / Math.PI,
    ]);
  }

  return {
    type: 'LineString',
    coordinates,
  };
}

/**
 * Format duration in minutes to readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const h = Math.round((minutes % 1440) / 60);
    return h > 0 ? `${days}d ${h}h` : `${days}d`;
  }
}

/**
 * Estimate train duration based on distance and region
 */
function estimateTrainDuration(distanceKm: number, fromName?: string, toName?: string): number {
  // Check if in regions with high-speed rail
  const highSpeedRegions = ['France', 'Japan', 'China', 'Germany', 'Spain', 'Italy', 'UK', 'South Korea'];
  const hasHighSpeed = highSpeedRegions.some(
    region => fromName?.includes(region) || toName?.includes(region)
  );

  // Average speeds: high-speed ~250 km/h, regular ~100 km/h
  const avgSpeed = hasHighSpeed ? 200 : 80;
  return (distanceKm / avgSpeed) * 60; // minutes
}

/**
 * Estimate flight duration based on distance
 */
function estimateFlightDuration(distanceKm: number): number {
  // Average cruising speed ~800 km/h + 2h for airport procedures
  const flightTime = distanceKm / 800;
  const totalHours = flightTime + 2; // Add 2 hours for check-in, boarding, taxiing
  return totalHours * 60; // minutes
}

/**
 * Get route information between two points for a given transport mode
 */
export async function getRouteInfo(
  from: [number, number],
  to: [number, number],
  mode: TransportMode,
  fromName?: string,
  toName?: string
): Promise<RouteInfo> {
  const straightLineDistance = calculateDistance(from, to);

  // For car, bus, and train, use Mapbox Directions for real routes
  if (ROUTABLE_MODES.includes(mode)) {
    const route = await fetchMapboxRoute(from, to, MAPBOX_PROFILES[mode]);

    if (route) {
      const distanceKm = route.distance / 1000;
      let durationMinutes = route.duration / 60;

      // For bus, add 20% more time for stops
      if (mode === 'bus') {
        durationMinutes *= 1.2;
      }

      // For train, estimate based on region (high-speed vs regular)
      if (mode === 'train') {
        durationMinutes = estimateTrainDuration(distanceKm, fromName, toName);
      }

      return {
        mode,
        distance: distanceKm,
        duration: durationMinutes,
        durationText: formatDuration(durationMinutes),
        geometry: route.geometry,
        isEstimate: mode === 'train', // Train duration is still an estimate
      };
    }
  }

  // For flight, use great circle arc
  if (mode === 'flight') {
    const durationMinutes = estimateFlightDuration(straightLineDistance);
    const arc = generateGreatCircleArc(from, to);

    return {
      mode,
      distance: straightLineDistance,
      duration: durationMinutes,
      durationText: `~${formatDuration(durationMinutes)}`,
      geometry: arc,
      isEstimate: true,
    };
  }

  // Fallback
  return {
    mode,
    distance: straightLineDistance,
    duration: (straightLineDistance / 100) * 60,
    durationText: `~${formatDuration((straightLineDistance / 100) * 60)}`,
    geometry: null,
    isEstimate: true,
  };
}

/**
 * Check if a route is viable for a given mode
 */
export function isRouteViable(
  from: [number, number],
  to: [number, number],
  mode: TransportMode
): boolean {
  const distance = calculateDistance(from, to);

  // Check for ocean crossing
  const fromInAmericas = from[0] < -30;
  const toInAmericas = to[0] < -30;
  const fromInEastAsia = from[0] > 100;
  const toInEastAsia = to[0] > 100;

  const crossesOcean =
    (fromInAmericas !== toInAmericas && !fromInEastAsia && !toInEastAsia) ||
    ((fromInAmericas && toInEastAsia) || (toInAmericas && fromInEastAsia));

  if (crossesOcean && mode !== 'flight') {
    return false;
  }

  // Distance limits for ground transport
  if ((mode === 'train' || mode === 'bus' || mode === 'car') && distance > 2000) {
    return false;
  }

  return true;
}
