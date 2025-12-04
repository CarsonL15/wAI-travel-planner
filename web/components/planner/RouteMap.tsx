import { useEffect, useRef, useState } from 'react';
import { DESIGN } from '../../lib/constants';
import type { TripDestination, RouteLeg, TransportMode } from '../../lib/types';

interface RouteMapProps {
  destinations: TripDestination[];
  routeLegs?: RouteLeg[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Colors for different transport modes
const MODE_COLORS: Record<TransportMode, string> = {
  flight: '#8B5CF6', // Purple for flights
  train: '#059669',  // Green for trains
  bus: '#F59E0B',    // Amber for buses
  car: '#3B82F6',    // Blue for cars
};

// Check if WebGL is supported
const isWebGLSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

export default function RouteMap({ destinations, routeLegs = [] }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Check WebGL support on mount
  useEffect(() => {
    setWebGLSupported(isWebGLSupported());
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN || !webGLSupported) return;

    // Dynamically import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then((mapboxgl) => {
      if (!mapContainerRef.current || mapRef.current) return;

      mapboxgl.default.accessToken = MAPBOX_TOKEN;

      try {
        const map = new mapboxgl.default.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [12.5, 42], // Default to central Europe
          zoom: 4,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
        });

        mapRef.current = map;

        map.on('error', (e) => {
          console.error('Mapbox error:', e.error);
          setMapError('Map failed to load');
        });

        map.on('load', () => {
          // Add sources for each transport mode
          const modes: TransportMode[] = ['flight', 'train', 'bus', 'car'];

          modes.forEach((mode) => {
            // Add source for this mode
            map.addSource(`route-${mode}`, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
            });

            // For flights, use a dashed line to indicate it's in the air
            if (mode === 'flight') {
              map.addLayer({
                id: `route-${mode}-line`,
                type: 'line',
                source: `route-${mode}`,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': MODE_COLORS[mode],
                  'line-width': 3,
                  'line-dasharray': [4, 4],
                  'line-opacity': 0.8,
                },
              });
            } else {
              // Solid line for ground transport
              map.addLayer({
                id: `route-${mode}-line`,
                type: 'line',
                source: `route-${mode}`,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': MODE_COLORS[mode],
                  'line-width': 4,
                  'line-opacity': 0.9,
                },
              });
            }
          });

          // Add fallback route source (straight lines when no geometry)
          map.addSource('route-fallback', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          });

          map.addLayer({
            id: 'route-fallback-line',
            type: 'line',
            source: 'route-fallback',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': DESIGN.colors.primary,
              'line-width': 2,
              'line-dasharray': [2, 4],
              'line-opacity': 0.5,
            },
          });

          setMapLoaded(true);
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError('Failed to initialize map');
      }
    }).catch((error) => {
      console.error('Failed to load mapbox-gl:', error);
      setMapError('Failed to load map library');
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [webGLSupported]);

  // Update markers and routes when destinations/routeLegs change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Get destinations with coordinates
    const destinationsWithCoords = destinations.filter((d) => d.coordinates);

    // Clear all route sources
    const modes: TransportMode[] = ['flight', 'train', 'bus', 'car'];
    modes.forEach((mode) => {
      const source = map.getSource(`route-${mode}`) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    });

    const fallbackSource = map.getSource('route-fallback') as mapboxgl.GeoJSONSource;
    if (fallbackSource) {
      fallbackSource.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }

    if (destinationsWithCoords.length === 0) {
      return;
    }

    // Import mapbox-gl for marker creation
    import('mapbox-gl').then((mapboxgl) => {
      // Add markers for each destination
      destinationsWithCoords.forEach((dest, index) => {
        if (!dest.coordinates) return;

        // Create custom marker element
        const el = document.createElement('div');
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.primaryLight} 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(30, 58, 95, 0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
          z-index: 10;
        `;
        el.textContent = String(index + 1);

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat(dest.coordinates)
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px; font-family: Inter, sans-serif;">
                <strong style="font-size: 14px;">${dest.name}</strong>
                <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
                  ${dest.nights} ${dest.nights === 1 ? 'night' : 'nights'}
                </p>
              </div>
            `)
          )
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Group route legs by mode
      const legsByMode: Record<TransportMode, GeoJSON.Feature[]> = {
        flight: [],
        train: [],
        bus: [],
        car: [],
      };
      const fallbackFeatures: GeoJSON.Feature[] = [];

      // Create a map of destination IDs to coordinates
      const destCoordMap = new Map<string, [number, number]>();
      destinations.forEach((d) => {
        if (d.coordinates) {
          destCoordMap.set(d.id, d.coordinates);
        }
      });

      // Process route legs
      if (routeLegs.length > 0) {
        routeLegs.forEach((leg) => {
          if (leg.geometry) {
            legsByMode[leg.mode].push({
              type: 'Feature',
              properties: {
                mode: leg.mode,
                duration: leg.durationText,
                distance: leg.distance,
              },
              geometry: leg.geometry,
            });
          } else {
            // Use straight line as fallback
            const fromCoords = destCoordMap.get(leg.fromId);
            const toCoords = destCoordMap.get(leg.toId);
            if (fromCoords && toCoords) {
              fallbackFeatures.push({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [fromCoords, toCoords],
                },
              });
            }
          }
        });
      } else {
        // No route legs provided, draw simple straight lines between consecutive destinations
        for (let i = 0; i < destinationsWithCoords.length - 1; i++) {
          const from = destinationsWithCoords[i];
          const to = destinationsWithCoords[i + 1];
          if (from.coordinates && to.coordinates) {
            fallbackFeatures.push({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [from.coordinates, to.coordinates],
              },
            });
          }
        }
      }

      // Update sources for each mode
      modes.forEach((mode) => {
        const source = map.getSource(`route-${mode}`) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: legsByMode[mode],
          });
        }
      });

      // Update fallback source
      if (fallbackSource) {
        fallbackSource.setData({
          type: 'FeatureCollection',
          features: fallbackFeatures,
        });
      }

      // Fit bounds to show all destinations
      const coordinates = destinationsWithCoords
        .map((d) => d.coordinates)
        .filter((c): c is [number, number] => c !== undefined);

      if (coordinates.length > 0) {
        const bounds = new mapboxgl.default.LngLatBounds();
        coordinates.forEach((coord) => bounds.extend(coord));

        // Also extend bounds for route geometries
        routeLegs.forEach((leg) => {
          if (leg.geometry) {
            leg.geometry.coordinates.forEach((coord) => {
              bounds.extend(coord as [number, number]);
            });
          }
        });

        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 8,
          duration: 1000,
        });
      }
    });
  }, [destinations, routeLegs, mapLoaded]);

  // Fallback UI for no WebGL support or error
  if (!webGLSupported || mapError) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: DESIGN.colors.bgSecondary,
          borderRadius: DESIGN.radius.xl,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke={DESIGN.colors.textMuted}
          strokeWidth="1"
          style={{ marginBottom: '1rem', opacity: 0.5 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <p
          style={{
            color: DESIGN.colors.textMuted,
            fontSize: '0.9375rem',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          {mapError || 'Interactive map requires WebGL support'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: DESIGN.radius.xl,
          overflow: 'hidden',
        }}
      />

      {/* Route legend */}
      {routeLegs.length > 0 && mapLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: DESIGN.radius.md,
            padding: '12px',
            boxShadow: DESIGN.shadows.md,
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: DESIGN.colors.textPrimary }}>
            Route Types
          </div>
          {Array.from(new Set(routeLegs.map((l) => l.mode))).map((mode) => (
            <div
              key={mode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '3px',
                  backgroundColor: MODE_COLORS[mode],
                  borderRadius: '2px',
                  ...(mode === 'flight' ? {
                    background: `repeating-linear-gradient(90deg, ${MODE_COLORS[mode]} 0, ${MODE_COLORS[mode]} 4px, transparent 4px, transparent 8px)`
                  } : {}),
                }}
              />
              <span style={{ color: DESIGN.colors.textSecondary, textTransform: 'capitalize' }}>
                {mode}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state overlay */}
      {destinations.length === 0 && mapLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: DESIGN.radius.lg,
            boxShadow: DESIGN.shadows.lg,
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke={DESIGN.colors.textMuted}
            strokeWidth="1.5"
            style={{ margin: '0 auto 12px' }}
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: DESIGN.colors.textSecondary,
            }}
          >
            Add destinations to see your route
          </p>
        </div>
      )}

      {/* Loading state */}
      {!mapLoaded && !mapError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: DESIGN.colors.bgSecondary,
            borderRadius: DESIGN.radius.xl,
          }}
        >
          <div
            style={{
              color: DESIGN.colors.textMuted,
              fontSize: '14px',
            }}
          >
            Loading map...
          </div>
        </div>
      )}
    </div>
  );
}
