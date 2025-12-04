import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getItineraries, ItinerarySummary } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import { DESIGN } from '../lib/constants';

export default function MyTrips() {
  const [trips, setTrips] = useState<ItinerarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadTrips() {
      if (!isAuthenticated()) {
        router.push('/');
        return;
      }

      try {
        const data = await getItineraries();
        setTrips(data.itineraries || []);
      } catch (err) {
        console.error('Failed to load trips:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trips');
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr.split('T')[0]);
  };

  if (loading) {
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
          <div
            style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${DESIGN.colors.border}`,
              borderTopColor: DESIGN.colors.accent,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: DESIGN.colors.textSecondary }}>Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: DESIGN.colors.bgPrimary,
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: DESIGN.colors.bgCard,
          borderBottom: `1px solid ${DESIGN.colors.border}`,
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                backgroundColor: 'transparent',
                color: DESIGN.colors.textSecondary,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 600,
                color: DESIGN.colors.textPrimary,
                fontFamily: "'DM Serif Display', Georgia, serif",
              }}
            >
              My Trips
            </h1>
          </div>

          <Link
            href="/planner"
            style={{
              padding: '10px 20px',
              background: DESIGN.gradients.primary,
              color: 'white',
              borderRadius: DESIGN.radius.md,
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Plan New Trip
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: `${DESIGN.colors.error}10`,
              border: `1px solid ${DESIGN.colors.error}`,
              borderRadius: DESIGN.radius.md,
              color: DESIGN.colors.error,
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        {trips.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              backgroundColor: DESIGN.colors.bgCard,
              borderRadius: DESIGN.radius.lg,
              border: `1px solid ${DESIGN.colors.border}`,
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: DESIGN.colors.bgSecondary,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={DESIGN.colors.textMuted} strokeWidth="1.5">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: DESIGN.colors.textPrimary }}>
              No trips yet
            </h2>
            <p style={{ margin: '0 0 24px', color: DESIGN.colors.textSecondary }}>
              Start planning your next adventure!
            </p>
            <Link
              href="/planner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: DESIGN.gradients.primary,
                color: 'white',
                borderRadius: DESIGN.radius.md,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/itinerary/${trip.id}`}
                style={{
                  display: 'block',
                  backgroundColor: DESIGN.colors.bgCard,
                  borderRadius: DESIGN.radius.lg,
                  border: `1px solid ${DESIGN.colors.border}`,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  transition: `all ${DESIGN.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = DESIGN.shadows.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Card Header - Destination */}
                <div
                  style={{
                    padding: '20px',
                    background: DESIGN.gradients.primary,
                    color: 'white',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: 600,
                      fontFamily: "'DM Serif Display', Georgia, serif",
                    }}
                  >
                    {trip.destination}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
                    {trip.daysCount} {trip.daysCount === 1 ? 'day' : 'days'}
                  </p>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={DESIGN.colors.textMuted}
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: DESIGN.colors.textMuted }}>
                      {trip.updatedAt ? `Updated ${formatRelativeTime(trip.updatedAt)}` : `Created ${formatRelativeTime(trip.createdAt)}`}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: DESIGN.colors.accent,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View & Edit
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
