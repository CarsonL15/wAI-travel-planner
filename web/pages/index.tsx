<<<<<<< HEAD
=======
import { useState, useEffect, useCallback, useRef } from 'react';
import { Auth } from 'aws-amplify';
import { useRouter } from 'next/router';
>>>>>>> mimi-intro
import Link from 'next/link';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

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
<<<<<<< HEAD
  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>wAI Travel Planner — Home page</h1>
      <p>Welcome, insert user name. Lead the wAI.</p>

      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Link href="/create-user"><button>Create User</button></Link>
        <Link href="/trip-preferences"><button>Trip Preferences</button></Link>
        <Link href="/itinerary-editor"><button>Itinerary Editor</button></Link>
      </nav>

      <section style={{ marginTop: '2rem' }}>
        <h2>Notes</h2>
        <ul>
          <li>Each page is a placeholder with a small form or editor.</li>
          <li>Remove auth/data wiring for now; add GraphQL/Auth later.</li>
        </ul>
      </section>
    </div>
=======
  const [user, setUser] = useState<{ username: string; id: string; } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; } | null>(null);
  const [pastItineraries, setPastItineraries] = useState<PastItinerary[]>([]);
  const searchInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    // Mock past itineraries - replace with actual API call
    setPastItineraries([
      { id: '1', destination: 'Paris, France', date: '2025-09-15' },
      { id: '2', destination: 'Tokyo, Japan', date: '2025-08-01' },
    ]);
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      // Mock profile check - replace with actual API call
      const userProfile = await fetchUserProfile(currentUser.id);
      setProfile(userProfile);
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setLoading(false);
    }
  };

  // Mock function - replace with actual API call
  const fetchUserProfile = async (userId: string) => {
    return null; // Simulate no profile yet
  };

  const handleMapClick = useCallback((event: any) => {
    if (profile && event.latLng) {
      setSelectedLocation({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  }, [profile]);

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

  return (
    <>
      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAEf5gOP7tIqD5uBgk--pQ7r2seTiEAQEg'}
        onLoad={() => console.log('Google Maps Script loaded successfully')}
        onError={(error) => console.error('Google Maps Script failed to load:', error)}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle as any}
          center={profile ? selectedLocation || centerNoProfile : centerNoProfile}
          zoom={profile ? 4 : 3}
          onClick={handleMapClick}
          options={profile ? interactiveMapOptions : staticMapOptions}
        >
          {selectedLocation && profile && (
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
        background: profile ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {!profile ? (
            <>
              <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                Welcome explorer, lead the wAI.
              </h1>
              <Link href="/profile">
                <button style={{
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  borderRadius: '8px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}>
                  Create User Profile
                </button>
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                Hi {user?.username}, lead the wAI.
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

      {profile && (
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
    </>
>>>>>>> mimi-intro
  );
}
