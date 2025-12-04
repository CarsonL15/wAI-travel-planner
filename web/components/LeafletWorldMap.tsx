import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletWorldMapProps {
  onCountryClick: (country: string) => void;
  onCountryHover: (country: string | null) => void;
  selectedCountry: string | null;
}

export default function LeafletWorldMap({ onCountryClick, onCountryHover, selectedCountry }: LeafletWorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // No tile layer needed - gradient is behind
    L.tileLayer('', {
      attribution: '',
    }).addTo(map);

    // Load GeoJSON data for countries
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(response => response.json())
      .then(data => {
        const geoJsonLayer = L.geoJSON(data, {
          style: (feature) => ({
            fillColor: 'rgba(93, 17, 224, 0.6)',
            weight: 0.5,
            opacity: 0.6,
            color: '#000000',
            fillOpacity: 0.85,
          }),
          onEachFeature: (feature, layer) => {
            const countryName = feature.properties?.ADMIN || feature.properties?.name;
            
            // Store the country name on the layer for easy access
            (layer as any).countryName = countryName;
            
            layer.on({
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillColor: 'rgba(251, 191, 36, 0.7)',
                  weight: 0.7,
                  opacity: 0.6,
                  color: '#000000',
                  fillOpacity: 0.85,
                });
                setHoveredCountry(countryName);
                onCountryHover(countryName);
              },
              mouseout: (e) => {
                setHoveredCountry(null);
                onCountryHover(null);
                // Don't reset style here - let the useEffect handle it
              },
              click: () => {
                onCountryClick(countryName);
              },
            });
          },
        });

        geoJsonLayer.addTo(map);
        geoJsonLayerRef.current = geoJsonLayer;
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update country styling based on selected and hovered countries
  useEffect(() => {
    if (!geoJsonLayerRef.current) return;

    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      const countryName = feature.properties?.ADMIN || feature.properties?.name;
      
      if (countryName === selectedCountry) {
        // Selected country is always gold with thick border
        layer.setStyle({
          fillColor: 'rgba(251, 191, 36, 0.7)',
          weight: 1.2,
          opacity: 0.8,
          color: '#000000',
          fillOpacity: 0.85,
        });
      } else if (countryName === hoveredCountry) {
        // Hovered country (but not selected) is gold with lighter weight
        layer.setStyle({
          fillColor: 'rgba(251, 191, 36, 0.7)',
          weight: 0.7,
          opacity: 0.6,
          color: '#000000',
          fillOpacity: 0.85,
        });
      } else {
        // All other countries are dark purple
        layer.setStyle({
          fillColor: 'rgba(93, 17, 224, 0.6)',
          weight: 0.5,
          opacity: 0.6,
          color: '#000000',
          fillOpacity: 0.85,
        });
      }
    });
  }, [selectedCountry, hoveredCountry]);

  return (
    <>
      {/* Gradient background overlay */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }} 
      />
      <div 
        ref={mapRef} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%',
          background: 'transparent',
          zIndex: 1,
        }} 
      />
    </>
  );
}
