import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import CreateUserModal from '../components/CreateUserModal';
import { useUser } from '@/context/UserContext';

interface Profile {
  id: string;
  interests: string[];
  travelStyle: string;
  budget: string;
  constraints: string[];
}

interface PastItinerary {
  id: string;
  destination: string;
  date: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: -1,
};

const centerNoProfile = {
  lat: 10, // Centered on Atlantic to show Americas and Africa
  lng: -30,
};

const staticMapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'none',
};

const interactiveMapOptions = {
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: true,
};

export default function Home() {
  const router = useRouter();
  const { user, setUser } = useUser();
  // controls which "index page" state is shown; defaults to false on reload
  const [hasProfile, setHasProfile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Initialize from localStorage if available, otherwise default to true
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarOpen');
      return stored ? stored === 'true' : true;
    }
    return true;
  });

  const clientUser = isMounted ? user : null;

  useEffect(() => { 
    setIsMounted(true); 
  }, []);

  useEffect(() => {
    // automatically open sidebar when a profile becomes available
    if (hasProfile) setSidebarOpen(true);
  }, [hasProfile]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; } | null>(null);
  const [pastItineraries, setPastItineraries] = useState<PastItinerary[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Mock past itineraries - replace with actual API call
    setPastItineraries([
      { id: '1', destination: 'Paris, France', date: '2025-09-15' },
      { id: '2', destination: 'Tokyo, Japan', date: '2025-08-01' },
    ]);
  }, []);


  const handleMapClick = useCallback((event: any) => {
    if (user && event.latLng) {
      setSelectedLocation({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  }, [user]);

  const handleDestinationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchInputRef.current as HTMLInputElement | null;
    if (input?.value) {
      // Navigate to trip preferences with the destination as a query parameter
      router.push(`/trip-preferences?destination=${encodeURIComponent(input.value)}`);
    }
  };

  // Debug log to check if API key is loaded
  useEffect(() => {
    console.log('Google Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const clearUserData = () => {
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      // clear all cookies (basic)
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
      });
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  return (
    <>
      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        onLoad={() => {
          console.log('Google Maps Script loaded successfully');
          setLoading(false);
        }}
        onError={(error) => {
          console.error('Google Maps Script failed to load:', error);
          setLoading(true);
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle as any}
          center={hasProfile ? selectedLocation || centerNoProfile : centerNoProfile}
          zoom={hasProfile ? 4 : 3}
          onClick={handleMapClick}
          options={hasProfile ? interactiveMapOptions : staticMapOptions}
        >
          {selectedLocation && hasProfile && (
            <Marker position={selectedLocation} />
          )}
        </GoogleMap>
      </LoadScript>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}>
        {!hasProfile && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: -1,
          }} />
        )}
        <div style={{
          textAlign: 'center',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          zIndex: 2,
        }}>
          {!hasProfile ? (
            <>
              <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                Welcome explorer, lead the wAI.
              </h1>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  borderRadius: '8px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                Create User Profile
              </button>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                Hi {user?.name || 'there'}, lead the wAI.
              </h1>
              <form onSubmit={handleDestinationSearch} style={{ position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Where to?"
                  style={{
                    padding: '1rem',
                    width: '300px',
                    fontSize: '1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </form>
            </>
          )}
        </div>
      </div>

      {/* Sidebar panel (separate open state so closing doesn't remove profile state) */}
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
            <Link href="/itinerary-editor" key={itinerary.id}>
              <div style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                background: '#ffffff',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={(newUser) => {
            if (newUser) setUser?.(newUser);
            setHasProfile(true);
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}
