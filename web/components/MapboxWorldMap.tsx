import { useEffect, useRef, useState } from 'react';
import { DESIGN } from '../lib/constants';

interface MapboxWorldMapProps {
  onCountryClick: (country: string) => void;
  onCountryHover: (country: string | null) => void;
  selectedCountry: string | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Check if WebGL is supported
const isWebGLSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};

export default function MapboxWorldMap({
  onCountryClick,
  onCountryHover,
  selectedCountry
}: MapboxWorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hoveredFeatureIdRef = useRef<string | number | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
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
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [0, 20],
          zoom: 1.8,
          minZoom: 1.5,
          maxZoom: 6,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          projection: 'mercator' as unknown as mapboxgl.Projection,
        });

        mapRef.current = map;

        map.on('error', (e) => {
          console.error('Mapbox error:', e.error);
          setMapError('Map failed to load');
        });

        map.on('load', () => {
          // Add country boundaries source
          map.addSource('countries', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
            generateId: true,
          });

          // Add country fill layer - base gray color
          map.addLayer({
            id: 'country-fills',
            type: 'fill',
            source: 'countries',
            paint: {
              'fill-color': '#334155',
              'fill-opacity': 0.4,
            },
          });

          // Add hover highlight layer
          map.addLayer({
            id: 'country-fills-hover',
            type: 'fill',
            source: 'countries',
            paint: {
              'fill-color': DESIGN.colors.accent,
              'fill-opacity': 0.6,
            },
            filter: ['==', ['id'], ''],
          });

          // Add selected highlight layer
          map.addLayer({
            id: 'country-fills-selected',
            type: 'fill',
            source: 'countries',
            paint: {
              'fill-color': DESIGN.colors.highlight,
              'fill-opacity': 0.8,
            },
            filter: ['==', ['id'], ''],
          });

          // Add country border layer
          map.addLayer({
            id: 'country-borders',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': 'rgba(255, 255, 255, 0.2)',
              'line-width': 0.5,
            },
          });

          // Add hover border layer
          map.addLayer({
            id: 'country-borders-hover',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': DESIGN.colors.accent,
              'line-width': 1.5,
            },
            filter: ['==', ['id'], ''],
          });

          // Add selected border layer
          map.addLayer({
            id: 'country-borders-selected',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': DESIGN.colors.highlight,
              'line-width': 2,
            },
            filter: ['==', ['id'], ''],
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

  // Handle hover and click interactions
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    const clearHover = () => {
      // Clear hover filter
      map.setFilter('country-fills-hover', ['==', ['id'], '']);
      map.setFilter('country-borders-hover', ['==', ['id'], '']);
      hoveredFeatureIdRef.current = null;
      setHoveredCountry(null);
      onCountryHover(null);
      map.getCanvas().style.cursor = '';
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const featureId = feature.id;

        // Only update if hovering a different feature
        if (featureId !== hoveredFeatureIdRef.current) {
          hoveredFeatureIdRef.current = featureId ?? null;

          // Update hover layer filter to show only this feature
          map.setFilter('country-fills-hover', ['==', ['id'], featureId ?? '']);
          map.setFilter('country-borders-hover', ['==', ['id'], featureId ?? '']);

          const countryName = feature.properties?.ADMIN || feature.properties?.name || '';
          setHoveredCountry(countryName);
          onCountryHover(countryName);
        }

        map.getCanvas().style.cursor = 'pointer';
      }
    };

    const handleMouseLeave = () => {
      clearHover();
    };

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const countryName = feature.properties?.ADMIN || feature.properties?.name || '';
        onCountryClick(countryName);

        // Fly to the clicked country
        import('mapbox-gl').then((mapboxgl) => {
          const bounds = new mapboxgl.default.LngLatBounds();
          const geometry = feature.geometry;

          if (geometry.type === 'Polygon') {
            geometry.coordinates[0].forEach((coord: number[]) => {
              bounds.extend([coord[0], coord[1]]);
            });
          } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach((polygon: number[][][]) => {
              polygon[0].forEach((coord: number[]) => {
                bounds.extend([coord[0], coord[1]]);
              });
            });
          }

          map.fitBounds(bounds, {
            padding: 100,
            maxZoom: 4,
            duration: 1000,
          });
        });
      }
    };

    // Use mousemove on the map itself for better tracking
    map.on('mousemove', 'country-fills', handleMouseMove);
    map.on('mouseleave', 'country-fills', handleMouseLeave);
    map.on('click', 'country-fills', handleClick);

    return () => {
      map.off('mousemove', 'country-fills', handleMouseMove);
      map.off('mouseleave', 'country-fills', handleMouseLeave);
      map.off('click', 'country-fills', handleClick);
    };
  }, [mapLoaded, onCountryClick, onCountryHover]);

  // Update selected country styling
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    if (selectedCountry) {
      // Find the feature ID for the selected country
      const features = map.querySourceFeatures('countries');
      const selectedFeature = features.find(
        (f) => (f.properties?.ADMIN || f.properties?.name) === selectedCountry
      );

      if (selectedFeature && selectedFeature.id !== undefined) {
        map.setFilter('country-fills-selected', ['==', ['id'], selectedFeature.id]);
        map.setFilter('country-borders-selected', ['==', ['id'], selectedFeature.id]);
      } else {
        // Country not found in current view, clear selection
        map.setFilter('country-fills-selected', ['==', ['id'], '']);
        map.setFilter('country-borders-selected', ['==', ['id'], '']);
      }
    } else {
      // No selection, clear the filter
      map.setFilter('country-fills-selected', ['==', ['id'], '']);
      map.setFilter('country-borders-selected', ['==', ['id'], '']);
    }
  }, [selectedCountry, mapLoaded]);

  // Fallback UI for no WebGL support or error
  if (!webGLSupported || mapError) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: '#1E293B',
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
        <p style={{ color: DESIGN.colors.textMuted, fontSize: '0.9375rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {mapError || 'Interactive map requires WebGL support'}
        </p>
        <p style={{ color: DESIGN.colors.textMuted, fontSize: '0.8125rem', textAlign: 'center', opacity: 0.7 }}>
          Enter your destination in the search field to continue
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

      {/* Country name tooltip */}
      {hoveredCountry && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#F8FAFC',
            padding: '10px 20px',
            borderRadius: DESIGN.radius.md,
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.025em',
            boxShadow: DESIGN.shadows.lg,
            pointerEvents: 'none',
            zIndex: 10,
            border: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          {hoveredCountry}
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
            background: '#1E293B',
            borderRadius: DESIGN.radius.xl,
          }}
        >
          <div style={{ color: DESIGN.colors.textMuted, fontSize: '14px' }}>
            Loading map...
          </div>
        </div>
      )}
    </div>
  );
}
