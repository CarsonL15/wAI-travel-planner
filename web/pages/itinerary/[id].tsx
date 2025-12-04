import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getItinerary, generateQuickItinerary } from '../../lib/api';
import { isAuthenticated } from '../../lib/auth';
import { DESIGN } from '../../lib/constants';
import type { TripDestination, BudgetLevel, CalendarDay, CalendarActivity, ActivityCategory, CostLevel } from '../../lib/types';
import CalendarEditor from '../../components/calendar/CalendarEditor';

interface PendingTrip {
  name: string;
  destinations: TripDestination[];
  startDate: string;
  budget: BudgetLevel;
  travelers: number;
}

interface Block {
  start: string;
  end: string;
  title: string;
  category: 'food' | 'museum' | 'outdoors' | 'shopping' | 'other';
  costBand: 'low' | 'med' | 'high';
  notes: string;
  address: string;
  lat: number;
  lon: number;
}

interface Day {
  date: string;
  blocks: Block[];
}

interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: Day[];
  packingList: string[];
  rationalePerDay: string[];
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'food':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case 'museum':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
      );
    case 'outdoors':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'shopping':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
  }
};

const getCostBandStyle = (costBand: string) => {
  switch (costBand) {
    case 'low':
      return { bg: 'rgba(5, 150, 105, 0.1)', color: DESIGN.colors.success, label: 'Budget' };
    case 'med':
      return { bg: 'rgba(217, 119, 6, 0.1)', color: DESIGN.colors.warning, label: 'Moderate' };
    case 'high':
      return { bg: 'rgba(220, 38, 38, 0.1)', color: DESIGN.colors.error, label: 'Premium' };
    default:
      return { bg: DESIGN.colors.bgSecondary, color: DESIGN.colors.textMuted, label: costBand };
  }
};

const getCategoryLabel = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

type ViewMode = 'list' | 'calendar';

export default function ItineraryDetail() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripName, setTripName] = useState<string>('Your Trip');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const router = useRouter();
  const { id } = router.query;

  // Convert itinerary to CalendarDay format for the calendar editor
  const calendarDays: CalendarDay[] = useMemo(() => {
    if (!itinerary) return [];

    return itinerary.days.map((day, dayIndex) => ({
      date: day.date,
      destinationName: itinerary.rationalePerDay?.[dayIndex]?.split(' - ')[0] || itinerary.destination.split(' → ')[0] || 'Destination',
      activities: day.blocks.map((block, blockIndex) => ({
        id: `day-${dayIndex}-block-${blockIndex}`,
        dayIndex,
        startTime: block.start,
        endTime: block.end,
        title: block.title,
        description: block.notes,
        category: mapBlockCategoryToActivityCategory(block.category),
        location: block.address,
        estimatedCost: mapBlockCostToLevel(block.costBand),
        isCustom: false,
      })),
    }));
  }, [itinerary]);

  // Map block category to ActivityCategory
  function mapBlockCategoryToActivityCategory(category: Block['category']): ActivityCategory {
    const mapping: Record<Block['category'], ActivityCategory> = {
      food: 'food',
      museum: 'culture',
      outdoors: 'outdoor',
      shopping: 'shopping',
      other: 'other',
    };
    return mapping[category] || 'other';
  }

  // Map block cost band to CostLevel
  function mapBlockCostToLevel(costBand: Block['costBand']): CostLevel {
    const mapping: Record<Block['costBand'], CostLevel> = {
      low: 'low',
      med: 'medium',
      high: 'high',
    };
    return mapping[costBand] || 'medium';
  }

  // Handle save from calendar editor
  const handleCalendarSave = (days: CalendarDay[]) => {
    // Convert back to Itinerary format and update state
    if (!itinerary) return;

    const updatedDays: Day[] = days.map((calDay) => ({
      date: calDay.date,
      blocks: calDay.activities.map((activity) => ({
        start: activity.startTime,
        end: activity.endTime,
        title: activity.title,
        category: mapActivityCategoryToBlock(activity.category),
        costBand: mapCostLevelToBlock(activity.estimatedCost),
        notes: activity.description,
        address: activity.location,
        lat: 0,
        lon: 0,
      })),
    }));

    setItinerary({ ...itinerary, days: updatedDays });
    // TODO: Save to backend
    console.log('Saving itinerary...', updatedDays);
  };

  function mapActivityCategoryToBlock(category: ActivityCategory): Block['category'] {
    const mapping: Record<ActivityCategory, Block['category']> = {
      sightseeing: 'other',
      food: 'food',
      outdoor: 'outdoors',
      culture: 'museum',
      shopping: 'shopping',
      relaxation: 'other',
      nightlife: 'other',
      other: 'other',
    };
    return mapping[category] || 'other';
  }

  function mapCostLevelToBlock(cost: CostLevel): Block['costBand'] {
    const mapping: Record<CostLevel, Block['costBand']> = {
      free: 'low',
      low: 'low',
      medium: 'med',
      high: 'high',
    };
    return mapping[cost] || 'med';
  }

  // Track if we've already started loading to prevent double-execution in React Strict Mode
  const [hasStartedLoading, setHasStartedLoading] = useState(false);

  useEffect(() => {
    if (!id || hasStartedLoading) return;

    setHasStartedLoading(true);

    if (id === 'preview') {
      handlePreviewMode();
    } else {
      checkAuthAndLoad(id as string);
    }
  }, [id, hasStartedLoading]);

  const checkAuthAndLoad = async (itineraryId: string) => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/');
      return;
    }
    loadItinerary(itineraryId);
  };

  const handlePreviewMode = async () => {
    // Check auth first
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/');
      return;
    }

    // Get pending trip from sessionStorage
    const pendingTripData = sessionStorage.getItem('pendingTrip');
    if (!pendingTripData) {
      setError('No trip data found. Please go back and create a trip first.');
      setLoading(false);
      return;
    }

    try {
      const pendingTrip: PendingTrip = JSON.parse(pendingTripData);
      setTripName(pendingTrip.name);
      setGenerating(true);
      setLoading(false);

      // Call the API to generate the itinerary
      const generatedData = await generateQuickItinerary({
        destinations: pendingTrip.destinations.map(d => ({
          name: d.name,
          nights: d.nights,
        })),
        startDate: pendingTrip.startDate,
        budget: pendingTrip.budget,
        travelers: pendingTrip.travelers,
      });

      // Transform the generated data to match our Itinerary interface
      // The API returns GeneratedItinerary, we need to adapt it
      const transformedItinerary = transformGeneratedItinerary(generatedData, pendingTrip);
      setItinerary(transformedItinerary);

      // Clear the pending trip from sessionStorage
      sessionStorage.removeItem('pendingTrip');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate itinerary: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  // Transform GeneratedItinerary to our display format
  const transformGeneratedItinerary = (data: any, pendingTrip: PendingTrip): Itinerary => {
    const allDays: Day[] = [];
    const rationalePerDay: string[] = [];

    // Flatten all days from all destinations
    data.destinations?.forEach((dest: any) => {
      dest.days?.forEach((day: any) => {
        const blocks: Block[] = day.activities?.map((activity: any) => ({
          start: activity.time || '09:00',
          end: activity.endTime || '10:00',
          title: activity.title || 'Activity',
          category: mapCategory(activity.category),
          costBand: mapCostLevel(activity.estimatedCost),
          notes: activity.description || '',
          address: activity.location || '',
          lat: activity.coordinates?.[1] || 0,
          lon: activity.coordinates?.[0] || 0,
        })) || [];

        allDays.push({
          date: day.date || new Date().toISOString().split('T')[0],
          blocks,
        });

        // Add a rationale if available
        rationalePerDay.push(`${dest.name} - Day ${day.dayNumber}`);
      });
    });

    // Calculate end date
    const startDate = new Date(pendingTrip.startDate);
    const totalNights = pendingTrip.destinations.reduce((sum, d) => sum + d.nights, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalNights);

    return {
      id: 'preview',
      destination: pendingTrip.destinations.map(d => d.name).join(' → '),
      startDate: pendingTrip.startDate,
      endDate: endDate.toISOString().split('T')[0],
      days: allDays,
      packingList: data.packingList || [],
      rationalePerDay,
    };
  };

  // Map activity categories to our format
  const mapCategory = (category: string): Block['category'] => {
    const categoryMap: Record<string, Block['category']> = {
      'sightseeing': 'other',
      'food': 'food',
      'outdoor': 'outdoors',
      'culture': 'museum',
      'shopping': 'shopping',
      'relaxation': 'other',
      'nightlife': 'other',
      'other': 'other',
    };
    return categoryMap[category] || 'other';
  };

  // Map cost levels to our format
  const mapCostLevel = (cost: string): Block['costBand'] => {
    const costMap: Record<string, Block['costBand']> = {
      'free': 'low',
      'low': 'low',
      'medium': 'med',
      'high': 'high',
    };
    return costMap[cost] || 'med';
  };

  const loadItinerary = async (itineraryId: string) => {
    try {
      const data = await getItinerary(itineraryId);
      setItinerary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load itinerary: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || generating) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: DESIGN.colors.bgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: '400px',
            padding: '2rem',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            style={{ animation: 'spin 1s linear infinite', color: DESIGN.colors.primary }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              opacity="0.25"
            />
            <path
              fill="currentColor"
              opacity="0.75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {generating ? (
            <>
              <h2
                style={{
                  marginTop: '1.5rem',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: DESIGN.colors.textPrimary,
                }}
              >
                Generating Your Itinerary
              </h2>
              <p style={{ marginTop: '0.5rem', color: DESIGN.colors.textSecondary, lineHeight: 1.5 }}>
                Our AI is crafting a personalized travel plan for <strong>{tripName}</strong>.
                This may take a minute...
              </p>
            </>
          ) : (
            <p style={{ marginTop: '1rem', color: DESIGN.colors.textSecondary }}>Loading itinerary...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: DESIGN.colors.bgPrimary,
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              borderRadius: DESIGN.radius.lg,
              color: DESIGN.colors.error,
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/planner">
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: DESIGN.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: DESIGN.radius.md,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: `all ${DESIGN.transitions.fast}`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Planner
              </button>
            </Link>
            <Link href="/">
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: DESIGN.colors.textSecondary,
                  border: `1px solid ${DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.md,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: `all ${DESIGN.transitions.fast}`,
                }}
              >
                Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: DESIGN.colors.bgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: DESIGN.colors.textSecondary }}>Itinerary not found</p>
      </div>
    );
  }

  // Calendar view - full screen editor
  if (viewMode === 'calendar') {
    return (
      <CalendarEditor
        tripName={tripName || itinerary.destination}
        initialDays={calendarDays}
        onSave={handleCalendarSave}
        onBack={() => setViewMode('list')}
      />
    );
  }

  // List view - original layout
  return (
    <div
      style={{
        minHeight: '100vh',
        background: DESIGN.colors.bgPrimary,
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          padding: '1rem 2rem',
          backgroundColor: DESIGN.colors.bgCard,
          borderBottom: `1px solid ${DESIGN.colors.border}`,
          boxShadow: DESIGN.shadows.sm,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/">
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                color: DESIGN.colors.textSecondary,
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = DESIGN.colors.primary;
                e.currentTarget.style.color = DESIGN.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = DESIGN.colors.border;
                e.currentTarget.style.color = DESIGN.colors.textSecondary;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </Link>

          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              padding: '0.25rem',
              backgroundColor: DESIGN.colors.bgSecondary,
              borderRadius: DESIGN.radius.md,
            }}
          >
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: viewMode === 'list' ? DESIGN.colors.bgCard : 'transparent',
                border: 'none',
                borderRadius: DESIGN.radius.sm,
                color: viewMode === 'list' ? DESIGN.colors.primary : DESIGN.colors.textMuted,
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.fast}`,
                boxShadow: viewMode === 'list' ? DESIGN.shadows.sm : 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: viewMode === 'calendar' ? DESIGN.colors.bgCard : 'transparent',
                border: 'none',
                borderRadius: DESIGN.radius.sm,
                color: viewMode === 'calendar' ? DESIGN.colors.primary : DESIGN.colors.textMuted,
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.fast}`,
                boxShadow: viewMode === 'calendar' ? DESIGN.shadows.sm : 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Calendar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <header className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 400,
              color: DESIGN.colors.textPrimary,
              marginBottom: '0.5rem',
            }}
          >
            {itinerary.destination}
          </h1>
          <p style={{ color: DESIGN.colors.textSecondary, fontSize: '1rem' }}>
            {new Date(itinerary.startDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(itinerary.endDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {/* Days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {itinerary.days.map((day, dayIndex) => (
            <div
              key={day.date}
              className="animate-fade-in-up"
              style={{
                backgroundColor: DESIGN.colors.bgCard,
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.xl,
                padding: '1.5rem',
                boxShadow: DESIGN.shadows.sm,
                animationDelay: `${dayIndex * 100}ms`,
              }}
            >
              {/* Day Header */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    color: DESIGN.colors.textPrimary,
                    marginBottom: '0.25rem',
                  }}
                >
                  Day {dayIndex + 1}
                </h2>
                <p style={{ fontSize: '0.875rem', color: DESIGN.colors.textMuted }}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {itinerary.rationalePerDay?.[dayIndex] && (
                  <p
                    style={{
                      marginTop: '0.75rem',
                      color: DESIGN.colors.textSecondary,
                      fontSize: '0.9375rem',
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                    }}
                  >
                    {itinerary.rationalePerDay[dayIndex]}
                  </p>
                )}
              </div>

              {/* Blocks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {day.blocks.map((block, blockIndex) => {
                  const costStyle = getCostBandStyle(block.costBand);
                  return (
                    <div
                      key={blockIndex}
                      style={{
                        backgroundColor: DESIGN.colors.bgSecondary,
                        border: `1px solid ${DESIGN.colors.border}`,
                        borderRadius: DESIGN.radius.lg,
                        padding: '1rem 1.25rem',
                        transition: `all ${DESIGN.transitions.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = DESIGN.colors.accent;
                        e.currentTarget.style.boxShadow = DESIGN.shadows.sm;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = DESIGN.colors.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Block Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: DESIGN.radius.md,
                              backgroundColor: DESIGN.colors.bgCard,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: DESIGN.colors.primary,
                            }}
                          >
                            {getCategoryIcon(block.category)}
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: DESIGN.colors.textPrimary,
                                margin: 0,
                              }}
                            >
                              {block.title}
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: DESIGN.colors.textMuted, margin: 0 }}>
                              {block.start} - {block.end}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: DESIGN.radius.sm,
                              backgroundColor: costStyle.bg,
                              color: costStyle.color,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {costStyle.label}
                          </span>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: DESIGN.radius.sm,
                              backgroundColor: DESIGN.colors.bgCard,
                              color: DESIGN.colors.textSecondary,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {getCategoryLabel(block.category)}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {block.notes && (
                        <p
                          style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.875rem',
                            color: DESIGN.colors.textSecondary,
                            lineHeight: 1.5,
                          }}
                        >
                          {block.notes}
                        </p>
                      )}

                      {/* Address */}
                      {block.address && (
                        <p
                          style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.8125rem',
                            color: DESIGN.colors.textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {block.address}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Packing List */}
        {itinerary.packingList && itinerary.packingList.length > 0 && (
          <div
            className="animate-fade-in-up"
            style={{
              marginTop: '2.5rem',
              backgroundColor: DESIGN.colors.bgCard,
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.xl,
              padding: '1.5rem',
              boxShadow: DESIGN.shadows.sm,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: DESIGN.colors.textPrimary,
                marginBottom: '1rem',
              }}
            >
              Packing List
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {itinerary.packingList.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: DESIGN.colors.bgSecondary,
                    borderRadius: DESIGN.radius.md,
                    fontSize: '0.875rem',
                    color: DESIGN.colors.textSecondary,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={DESIGN.colors.success}
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
