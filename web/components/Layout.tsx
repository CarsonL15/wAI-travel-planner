import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import Header from './Header';
import { useUser } from '@/context/UserContext';

interface PastItinerary {
  id: string;
  destination: string;
  date: string;
}

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarOpen');
      return stored ? stored === 'true' : false;
    }
    return false;
  });
  const [pastItineraries, setPastItineraries] = useState<PastItinerary[]>([]);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Set hasProfile based on user data
    setHasProfile(Boolean(user?.name && user?.interests?.length));
    
    // Mock past itineraries - replace with actual API call
    setPastItineraries([
      { id: '1', destination: 'Zurich, Switzerland', date: '2025-09-15' },
      { id: '2', destination: 'Tokyo, Japan', date: '2025-08-01' },
    ]);
  }, [user]);

  return (
    <>
      <Header onToggleSidebar={() => {
        if (hasProfile) {
          setSidebarOpen(true);
        }
      }} />

      {/* Sidebar panel */}
      {hasProfile && sidebarOpen && (
        <aside style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '300px',
          height: '100vh',
          background: '#e6f3ff',
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          overflowY: 'auto',
          zIndex: 150,
          paddingTop: '5rem', // Add padding for header
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Past Itineraries</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>

          {pastItineraries.map((itinerary) => (
            <Link href={`/itinerary/${itinerary.id}`} key={itinerary.id}>
              <div style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                background: '#ffffff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}>
                <h3 style={{ margin: 0 }}>{itinerary.destination}</h3>
                <p style={{ color: '#666', marginTop: '0.25rem' }}>{itinerary.date}</p>
              </div>
            </Link>
          ))}
        </aside>
      )}

      {/* Small tab to re-open the sidebar when closed */}
      {hasProfile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          style={{
            position: 'fixed',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            background: '#e6f3ff',
            border: '1px solid #cce4ff',
            borderRadius: '0 8px 8px 0',
            padding: '0.5rem',
            cursor: 'pointer',
            zIndex: 150,
            boxShadow: '2px 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          ▶
        </button>
      )}

      {children}
    </>
  );
}