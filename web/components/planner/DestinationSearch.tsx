import { useState, useRef, useEffect } from 'react';
import { DESIGN } from '../../lib/constants';
import type { GeocodingResult } from '../../lib/types';

interface DestinationSearchProps {
  onSelect: (result: GeocodingResult) => void;
  nextOrder: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function DestinationSearch({
  onSelect,
  nextOrder,
}: DestinationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!query) {
          setIsActive(false);
        }
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  // Geocode search using Mapbox
  const searchDestinations = async (searchQuery: string) => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?types=place,locality,region&limit=5&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      const geocodedResults: GeocodingResult[] = data.features?.map(
        (feature: { place_name: string; center: [number, number]; context?: Array<{ id: string; text: string }> }) => ({
          name: feature.place_name.split(',')[0],
          coordinates: feature.center as [number, number],
          country: feature.context?.find((c: { id: string }) => c.id.startsWith('country'))?.text,
          region: feature.context?.find((c: { id: string }) => c.id.startsWith('region'))?.text,
        })
      ) || [];

      setResults(geocodedResults);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchDestinations(value);
    }, 300);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setResults([]);
        setQuery('');
        setIsActive(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: GeocodingResult) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setIsActive(false);
  };

  const handleCardClick = () => {
    setIsActive(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      ref={containerRef}
      onClick={!isActive ? handleCardClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        backgroundColor: DESIGN.colors.bgCard,
        border: `1px dashed ${isActive ? DESIGN.colors.accent : DESIGN.colors.border}`,
        borderRadius: DESIGN.radius.lg,
        cursor: isActive ? 'default' : 'pointer',
        transition: `all ${DESIGN.transitions.fast}`,
        minHeight: isActive ? 'auto' : '72px',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = DESIGN.colors.accent;
          e.currentTarget.style.backgroundColor = DESIGN.colors.bgSecondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = DESIGN.colors.border;
          e.currentTarget.style.backgroundColor = DESIGN.colors.bgCard;
        }
      }}
    >
      {!isActive ? (
        // Collapsed state - shows add prompt
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '100%',
          }}
        >
          {/* Order number placeholder */}
          <div
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.full,
              color: DESIGN.colors.textMuted,
              fontSize: '12px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {nextOrder}
          </div>

          {/* Add prompt */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={DESIGN.colors.textMuted}
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span
              style={{
                fontSize: '14px',
                color: DESIGN.colors.textMuted,
              }}
            >
              Add destination
            </span>
          </div>
        </div>
      ) : (
        // Active state - shows search and results
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Order number */}
            <div
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px dashed ${DESIGN.colors.accent}`,
                borderRadius: DESIGN.radius.full,
                color: DESIGN.colors.accent,
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {nextOrder}
            </div>

            {/* Search input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a city..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingRight: '36px',
                  border: `1px solid ${DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.md,
                  fontSize: '14px',
                  color: DESIGN.colors.textPrimary,
                  backgroundColor: DESIGN.colors.bgCard,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = DESIGN.colors.accent;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = DESIGN.colors.border;
                }}
              />
              {/* Loading spinner or search icon */}
              {loading ? (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${DESIGN.colors.border}`,
                    borderTopColor: DESIGN.colors.accent,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={DESIGN.colors.textMuted}
                  strokeWidth="2"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              )}
            </div>

            {/* Cancel button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                setResults([]);
                setIsActive(false);
              }}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: DESIGN.radius.md,
                cursor: 'pointer',
                color: DESIGN.colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results list - inline within the card */}
          {results.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: `1px solid ${DESIGN.colors.border}`,
                marginTop: '4px',
                paddingTop: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {results.map((result, index) => (
                <button
                  key={`${result.name}-${result.coordinates.join(',')}`}
                  onClick={() => handleSelect(result)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: 'none',
                    background: index === selectedIndex ? DESIGN.colors.bgSecondary : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: DESIGN.radius.md,
                    transition: `background ${DESIGN.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = DESIGN.colors.bgSecondary;
                    setSelectedIndex(index);
                  }}
                  onMouseLeave={(e) => {
                    if (index !== selectedIndex) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Location icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={DESIGN.colors.textMuted}
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>

                  {/* Location info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: DESIGN.colors.textPrimary,
                      }}
                    >
                      {result.name}
                    </div>
                    {(result.region || result.country) && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: DESIGN.colors.textMuted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {[result.region, result.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Add indicator */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={DESIGN.colors.accent}
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* No results state */}
          {query && !loading && results.length === 0 && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: DESIGN.colors.textMuted,
                fontSize: '13px',
              }}
            >
              No destinations found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
