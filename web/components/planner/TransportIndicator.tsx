import { useState, useRef, useEffect } from 'react';
import { DESIGN } from '../../lib/constants';
import type { TransportMode, RouteLeg } from '../../lib/types';

interface TransportIndicatorProps {
  mode: TransportMode;
  recommendedMode?: TransportMode;
  fromCoordinates?: [number, number];
  toCoordinates?: [number, number];
  fromName?: string;
  toName?: string;
  routeLeg?: RouteLeg; // Real route data from Mapbox
  onModeChange?: (mode: TransportMode) => void;
}

const TRANSPORT_ICONS: Record<TransportMode, JSX.Element> = {
  flight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  ),
  train: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  ),
  bus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
    </svg>
  ),
  car: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
  ),
};

const TRANSPORT_OPTIONS: Array<{ value: TransportMode; label: string }> = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' },
];

// Calculate distance between two coordinates in km (Haversine formula)
export function calculateDistance(
  from: [number, number],
  to: [number, number]
): number {
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

// Check if two locations require crossing an ocean (simplified check based on coordinates)
export function requiresOceanCrossing(
  from: [number, number],
  to: [number, number]
): boolean {
  const [fromLon, fromLat] = from;
  const [toLon, toLat] = to;

  // Check if one point is in Americas and the other in Europe/Africa/Asia
  const fromInAmericas = fromLon < -30;
  const toInAmericas = toLon < -30;

  // Check if one point is in East Asia/Oceania and the other in Americas
  const fromInEastAsia = fromLon > 100;
  const toInEastAsia = toLon > 100;

  // Atlantic crossing
  if (fromInAmericas !== toInAmericas && !fromInEastAsia && !toInEastAsia) {
    return true;
  }

  // Pacific crossing (Americas to East Asia)
  if ((fromInAmericas && toInEastAsia) || (toInAmericas && fromInEastAsia)) {
    return true;
  }

  return false;
}

// Check if ground transport is viable between two points
function isGroundTransportViable(
  from: [number, number],
  to: [number, number],
  distanceKm: number
): boolean {
  // Not viable if crossing an ocean
  if (requiresOceanCrossing(from, to)) {
    return false;
  }

  // Not viable for extremely long distances (over 2000km for train, 1500km for bus/car)
  if (distanceKm > 2000) {
    return false;
  }

  return true;
}

// Estimate travel duration based on mode and distance
function estimateDuration(
  mode: TransportMode,
  distanceKm: number,
  fromCoords?: [number, number],
  toCoords?: [number, number]
): string | null {
  // Check viability for ground transport
  if (fromCoords && toCoords) {
    if ((mode === 'train' || mode === 'bus' || mode === 'car') &&
        !isGroundTransportViable(fromCoords, toCoords, distanceKm)) {
      return null; // Not viable
    }
  }

  let hours: number;

  switch (mode) {
    case 'flight':
      // ~800 km/h average + 2h for airport procedures
      hours = distanceKm / 800 + 2;
      break;
    case 'train':
      // ~150 km/h average for high-speed, ~80 km/h for regular
      hours = distanceKm / 120;
      break;
    case 'bus':
      // ~60 km/h average
      hours = distanceKm / 60;
      break;
    case 'car':
      // ~80 km/h average including stops
      hours = distanceKm / 80;
      break;
    default:
      hours = distanceKm / 100;
  }

  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    const days = Math.floor(hours / 24);
    const h = Math.round(hours % 24);
    return h > 0 ? `${days}d ${h}h` : `${days}d`;
  }
}

// Countries/regions with poor train infrastructure
const POOR_TRAIN_REGIONS = [
  'United States', 'USA', 'US',
  'Canada',
  'Australia',
  'New Zealand',
  'Brazil',
  'Argentina',
  'Chile',
  'South Africa',
  'Indonesia',
  'Philippines',
  'Thailand',
  'Vietnam',
  'Malaysia',
];

// Check if a location is in a region with poor train infrastructure
function isInPoorTrainRegion(locationName?: string): boolean {
  if (!locationName) return false;
  return POOR_TRAIN_REGIONS.some(region =>
    locationName.toLowerCase().includes(region.toLowerCase())
  );
}

// Get recommended transport mode based on distance and region
export function getRecommendedTransportMode(
  fromCoordinates: [number, number],
  toCoordinates: [number, number],
  fromName?: string,
  toName?: string
): TransportMode {
  const distance = calculateDistance(fromCoordinates, toCoordinates);

  // Check if ocean crossing is required - must fly
  if (requiresOceanCrossing(fromCoordinates, toCoordinates)) {
    return 'flight';
  }

  const inPoorTrainRegion = isInPoorTrainRegion(fromName) || isInPoorTrainRegion(toName);

  // Very long distance (> 800km) - recommend flight
  if (distance > 800) {
    return 'flight';
  }

  // Medium-long distance (400-800km)
  if (distance > 400) {
    // In regions with good train infrastructure, train can compete with flight
    if (!inPoorTrainRegion) {
      return 'train'; // High-speed rail is often faster door-to-door
    }
    return 'flight';
  }

  // Medium distance (150-400km)
  if (distance > 150) {
    if (inPoorTrainRegion) {
      return 'car';
    }
    return 'train';
  }

  // Short distance (< 150km)
  if (inPoorTrainRegion) {
    return 'car';
  }
  return 'train';
}

export default function TransportIndicator({
  mode,
  recommendedMode,
  fromCoordinates,
  toCoordinates,
  fromName,
  toName,
  routeLeg,
  onModeChange,
}: TransportIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use route leg data if available, otherwise calculate estimates
  const distance = routeLeg?.distance ?? (fromCoordinates && toCoordinates
    ? calculateDistance(fromCoordinates, toCoordinates)
    : null);

  // Use real duration from route leg if available
  const duration = routeLeg?.durationText ?? (distance
    ? estimateDuration(mode, distance, fromCoordinates, toCoordinates)
    : null);

  // Flag to show if using real data or estimates
  const isEstimate = routeLeg?.isEstimate ?? true;

  // Determine recommended mode based on distance and region
  const getRecommendedMode = (): TransportMode => {
    if (!distance) return 'train';

    // Check if ocean crossing is required - must fly
    if (fromCoordinates && toCoordinates && requiresOceanCrossing(fromCoordinates, toCoordinates)) {
      return 'flight';
    }

    const inPoorTrainRegion = isInPoorTrainRegion(fromName) || isInPoorTrainRegion(toName);

    // Very long distance (> 800km) - recommend flight
    if (distance > 800) {
      return 'flight';
    }

    // Medium-long distance (400-800km)
    if (distance > 400) {
      // In regions with good train infrastructure, train can compete with flight
      if (!inPoorTrainRegion) {
        return 'train'; // High-speed rail is often faster door-to-door
      }
      return 'flight';
    }

    // Medium distance (150-400km)
    if (distance > 150) {
      if (inPoorTrainRegion) {
        return 'car'; // Or bus
      }
      return 'train';
    }

    // Short distance (< 150km)
    if (inPoorTrainRegion) {
      return 'car';
    }
    return 'train';
  };

  const effectiveRecommendedMode = recommendedMode || getRecommendedMode();
  const isRecommended = mode === effectiveRecommendedMode;

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeSelect = (newMode: TransportMode) => {
    onModeChange?.(newMode);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 0',
        position: 'relative',
      }}
    >
      {/* Vertical dotted line */}
      <div
        style={{
          position: 'absolute',
          left: '26px',
          top: 0,
          bottom: 0,
          width: '2px',
          background: `repeating-linear-gradient(
            to bottom,
            ${DESIGN.colors.border} 0,
            ${DESIGN.colors.border} 4px,
            transparent 4px,
            transparent 8px
          )`,
        }}
      />

      {/* Transport badge - clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: isOpen ? DESIGN.colors.bgCard : DESIGN.colors.bgSecondary,
          border: `1px solid ${isOpen ? DESIGN.colors.accent : 'transparent'}`,
          borderRadius: DESIGN.radius.full,
          marginLeft: '44px',
          zIndex: isOpen ? 101 : 1,
          cursor: 'pointer',
          transition: `all ${DESIGN.transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = DESIGN.colors.bgCard;
            e.currentTarget.style.borderColor = DESIGN.colors.border;
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = DESIGN.colors.bgSecondary;
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        <span style={{ color: DESIGN.colors.textMuted, display: 'flex' }}>
          {TRANSPORT_ICONS[mode]}
        </span>
        {distance && (
          <span
            style={{
              fontSize: '12px',
              color: duration ? DESIGN.colors.textMuted : DESIGN.colors.error,
              fontWeight: 500,
              fontStyle: duration ? 'normal' : 'italic',
            }}
          >
            {duration || 'Not viable'}
          </span>
        )}
        {distance && (
          <span
            style={{
              fontSize: '11px',
              color: DESIGN.colors.textMuted,
              opacity: 0.7,
            }}
          >
            ({Math.round(distance)} km)
          </span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke={DESIGN.colors.textMuted}
          strokeWidth="2"
          style={{
            marginLeft: '2px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform ${DESIGN.transitions.fast}`,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% - 4px)',
            left: '44px',
            backgroundColor: DESIGN.colors.bgCard,
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.lg,
            boxShadow: DESIGN.shadows.lg,
            zIndex: 100,
            minWidth: '180px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: DESIGN.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: `1px solid ${DESIGN.colors.border}`,
            }}
          >
            Transport Mode
          </div>
          {TRANSPORT_OPTIONS.map((option) => {
            const isSelected = mode === option.value;
            const isThisRecommended = option.value === effectiveRecommendedMode;
            const optionDuration = distance
              ? estimateDuration(option.value, distance, fromCoordinates, toCoordinates)
              : null;
            const isViable = optionDuration !== null;

            return (
              <button
                key={option.value}
                onClick={() => isViable && handleModeSelect(option.value)}
                disabled={!isViable}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: 'none',
                  background: isSelected ? DESIGN.colors.bgSecondary : 'transparent',
                  cursor: isViable ? 'pointer' : 'not-allowed',
                  transition: `background ${DESIGN.transitions.fast}`,
                  opacity: isViable ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (isViable) {
                    e.currentTarget.style.background = DESIGN.colors.bgSecondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span
                  style={{
                    color: isSelected ? DESIGN.colors.accent : DESIGN.colors.textMuted,
                    display: 'flex',
                  }}
                >
                  {TRANSPORT_ICONS[option.value]}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: isViable ? DESIGN.colors.textPrimary : DESIGN.colors.textMuted,
                    fontWeight: isSelected ? 500 : 400,
                    textAlign: 'left',
                  }}
                >
                  {option.label}
                </span>
                {isViable ? (
                  <span
                    style={{
                      fontSize: '12px',
                      color: DESIGN.colors.textMuted,
                    }}
                  >
                    {optionDuration}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      color: DESIGN.colors.textMuted,
                      fontStyle: 'italic',
                    }}
                  >
                    Not viable
                  </span>
                )}
                {isThisRecommended && isViable && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: DESIGN.colors.success,
                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                      padding: '2px 6px',
                      borderRadius: DESIGN.radius.full,
                    }}
                  >
                    Best
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
