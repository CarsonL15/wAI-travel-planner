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
  const { user, setUser } = useUser();
  // controls which "index page" state is shown; defaults to false on reload
  const [hasProfile, setHasProfile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const clientUser = isMounted ? user : null;
  useEffect(() => { setIsMounted(true); }, []);
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
      // TODO: Implement destination search and navigation
      console.log('Searching for:', input.value);
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
        background: user ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
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
                Hi there, lead the wAI.
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

      {hasProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '300px',
          height: '100vh',
          background: 'white',
          boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          overflowY: 'auto',
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Past Itineraries</h2>
          {pastItineraries.map((itinerary) => (
            <Link href={`/itinerary/${itinerary.id}`} key={itinerary.id}>
              <div style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                background: '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
              }}>
                <h3>{itinerary.destination}</h3>
                <p style={{ color: '#666' }}>{itinerary.date}</p>
              </div>
            </Link>
          ))}
        </div>
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
