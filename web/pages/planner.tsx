import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { DESIGN } from '../lib/constants';
import { isAuthenticated, signOut } from '../lib/auth';
import type { TripDestination, BudgetLevel, PaceLevel, RouteLeg, TransportMode } from '../lib/types';
import { getRouteInfo } from '../lib/mapbox-directions';
import DestinationList from '../components/planner/DestinationList';
import RouteMap from '../components/planner/RouteMap';
import TripSettingsBar from '../components/planner/TripSettingsBar';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';

export default function PlannerPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [startDate, setStartDate] = useState(() => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [budget, setBudget] = useState<BudgetLevel>('moderate');
  const [travelers, setTravelers] = useState(2);
  const [pace, setPace] = useState<PaceLevel>('moderate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripName, setTripName] = useState('My Trip');
  const [isEditingName, setIsEditingName] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  // Route legs state - maps "fromId-toId" to route leg data
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [transportModes, setTransportModes] = useState<Record<string, TransportMode>>({});

  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth on mount and redirect if not logged in
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
      setAuthChecked(true);

      if (!authenticated) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  // Fetch route data when destinations or transport modes change
  useEffect(() => {
    const fetchRoutes = async () => {
      if (destinations.length < 2) {
        setRouteLegs([]);
        return;
      }

      const newRouteLegs: RouteLeg[] = [];

      for (let i = 0; i < destinations.length - 1; i++) {
        const from = destinations[i];
        const to = destinations[i + 1];

        if (!from.coordinates || !to.coordinates) continue;

        const legKey = `${from.id}-${to.id}`;
        const mode = transportModes[legKey] || 'train';

        try {
          const routeInfo = await getRouteInfo(
            from.coordinates,
            to.coordinates,
            mode,
            from.name,
            to.name
          );

          newRouteLegs.push({
            fromId: from.id,
            toId: to.id,
            mode: routeInfo.mode,
            geometry: routeInfo.geometry,
            duration: routeInfo.duration,
            durationText: routeInfo.durationText,
            distance: routeInfo.distance,
            isEstimate: routeInfo.isEstimate,
          });
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      }

      setRouteLegs(newRouteLegs);
    };

    fetchRoutes();
  }, [destinations, transportModes]);

  // Handle transport mode change from DestinationList
  const handleTransportModeChange = useCallback((fromId: string, toId: string, mode: TransportMode) => {
    setTransportModes(prev => ({
      ...prev,
      [`${fromId}-${toId}`]: mode,
    }));
  }, []);

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Clamp between 280px and 600px
      const clampedWidth = Math.min(Math.max(newWidth, 280), 600);
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Calculate total nights
  const totalNights = destinations.reduce((sum, d) => sum + d.nights, 0);

  // Calculate end date
  const getEndDate = () => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + totalNights);
    return end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Can generate if we have at least one destination
  const canGenerate = destinations.length > 0;

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (!canGenerate) return;

    setIsGenerating(true);

    try {
      // TODO: Call API to generate itinerary
      // For now, simulate a delay and navigate
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to itinerary page with trip data
      const tripData = {
        name: tripName,
        destinations,
        startDate,
        budget,
        travelers,
      };

      // Store in session for now (will be replaced with API)
      sessionStorage.setItem('pendingTrip', JSON.stringify(tripData));

      // Use 'preview' as the itinerary ID for now
      router.push('/itinerary/preview');
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: DESIGN.colors.bgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <svg
            width="40"
            height="40"
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
        </div>
      </div>
    );
  }

  // Don't render if not logged in (will redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Plan Your Trip | wAI Travel</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: DESIGN.colors.bgPrimary,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '16px 24px',
            backgroundColor: DESIGN.colors.bgCard,
            borderBottom: `1px solid ${DESIGN.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 400,
                color: DESIGN.colors.primary,
                textDecoration: 'none',
              }}
            >
              wAI Travel
            </Link>

            {/* Trip name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isEditingName ? (
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                  }}
                  autoFocus
                  style={{
                    padding: '4px 8px',
                    border: `1px solid ${DESIGN.colors.accent}`,
                    borderRadius: DESIGN.radius.md,
                    fontSize: '16px',
                    fontWeight: 500,
                    color: DESIGN.colors.textPrimary,
                    outline: 'none',
                  }}
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: DESIGN.radius.md,
                    fontSize: '16px',
                    fontWeight: 500,
                    color: DESIGN.colors.textPrimary,
                    cursor: 'pointer',
                    transition: `background ${DESIGN.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = DESIGN.colors.bgSecondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {tripName}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={DESIGN.colors.textMuted}
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}

              {destinations.length > 0 && (
                <span
                  style={{
                    fontSize: '13px',
                    color: DESIGN.colors.textMuted,
                  }}
                >
                  {totalNights} nights · {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {getEndDate()}
                </span>
              )}
            </div>
          </div>

          {/* Auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  signOut();
                  setIsLoggedIn(false);
                  router.push('/');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.md,
                  fontSize: '14px',
                  color: DESIGN.colors.textSecondary,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: DESIGN.colors.primary,
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  style={{
                    padding: '8px 16px',
                    background: DESIGN.gradients.primary,
                    border: 'none',
                    borderRadius: DESIGN.radius.md,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </header>

        {/* Settings bar */}
        <TripSettingsBar
          startDate={startDate}
          budget={budget}
          travelers={travelers}
          pace={pace}
          totalNights={totalNights}
          destinationCount={destinations.length}
          onStartDateChange={setStartDate}
          onBudgetChange={setBudget}
          onTravelersChange={setTravelers}
          onPaceChange={setPace}
          onGenerate={handleGenerate}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          {/* Left panel - Destination list (resizable) */}
          <div
            style={{
              width: `${sidebarWidth}px`,
              flexShrink: 0,
              backgroundColor: DESIGN.colors.bgCard,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <DestinationList
              destinations={destinations}
              startDate={startDate}
              onDestinationsChange={setDestinations}
              routeLegs={routeLegs}
              transportModes={transportModes}
              onTransportModeChange={handleTransportModeChange}
            />

            {/* Resize handle */}
            <div
              onMouseDown={() => setIsResizing(true)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '6px',
                height: '100%',
                cursor: 'col-resize',
                backgroundColor: isResizing ? DESIGN.colors.accent : 'transparent',
                borderRight: `1px solid ${DESIGN.colors.border}`,
                transition: `background-color ${DESIGN.transitions.fast}`,
                zIndex: 20,
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.backgroundColor = DESIGN.colors.bgSecondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Grip indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  opacity: 0.5,
                }}
              >
                <div style={{ width: '2px', height: '2px', borderRadius: '50%', backgroundColor: DESIGN.colors.textMuted }} />
                <div style={{ width: '2px', height: '2px', borderRadius: '50%', backgroundColor: DESIGN.colors.textMuted }} />
                <div style={{ width: '2px', height: '2px', borderRadius: '50%', backgroundColor: DESIGN.colors.textMuted }} />
              </div>
            </div>
          </div>

          {/* Right panel - Map */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                flex: 1,
                borderRadius: DESIGN.radius.xl,
                overflow: 'hidden',
                boxShadow: DESIGN.shadows.lg,
              }}
            >
              <RouteMap destinations={destinations} routeLegs={routeLegs} />
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToSignup={() => {
            setShowLoginModal(false);
            setShowSignupModal(true);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
          onSwitchToLogin={() => {
            setShowSignupModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
