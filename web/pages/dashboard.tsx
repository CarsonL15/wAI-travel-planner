import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function Dashboard() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadItineraries();
  }, []);

  const checkAuth = async () => {
    try {
      await Auth.currentAuthenticatedUser();
    } catch (error) {
      router.push('/');
    }
  };

  const loadItineraries = async () => {
    // TODO: Load itineraries from GraphQL
    // Mock data for now
    setItineraries([
      {
        id: '1',
        destination: 'Tokyo, Japan',
        startDate: '2024-03-15',
        endDate: '2024-03-22',
        createdAt: '2024-03-01T10:00:00Z',
      },
      {
        id: '2',
        destination: 'Paris, France',
        startDate: '2024-04-10',
        endDate: '2024-04-17',
        createdAt: '2024-03-05T14:30:00Z',
      },
    ]);
    setLoading(false);
  };

  const generateItinerary = async () => {
    setGenerating(true);
    try {
      // TODO: Call GraphQL mutation to generate itinerary
      console.log('Generating itinerary for:', formData);
      alert('Itinerary generation started! (TODO: Implement actual generation)');
      setShowGenerateForm(false);
      setFormData({ destination: '', startDate: '', endDate: '' });
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setGenerating(false);
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Your Travel Itineraries</h1>
        <div>
          <Link href="/profile">
            <button style={{ marginRight: '1rem' }}>Edit Profile</button>
          </Link>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => setShowGenerateForm(!showGenerateForm)}>
          {showGenerateForm ? 'Cancel' : 'Generate New Itinerary'}
        </button>
      </div>

      {showGenerateForm && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem', borderRadius: '4px' }}>
          <h3>Generate New Itinerary</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Destination:
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="e.g., Tokyo, Japan"
                style={{ marginLeft: '0.5rem', padding: '0.5rem', width: '200px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Start Date:
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              End Date:
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
              />
            </label>
          </div>
          <button onClick={generateItinerary} disabled={generating || !formData.destination || !formData.startDate || !formData.endDate}>
            {generating ? 'Generating...' : 'Generate Itinerary'}
          </button>
        </div>
      )}

      <div>
        <h2>Your Itineraries</h2>
        {itineraries.length === 0 ? (
          <p>No itineraries yet. Generate your first one!</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {itineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '1rem',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <h3>{itinerary.destination}</h3>
                <p>
                  {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
                </p>
                <p style={{ color: '#666', fontSize: '0.9em' }}>
                  Created: {new Date(itinerary.createdAt).toLocaleDateString()}
                </p>
                <Link href={`/itinerary/${itinerary.id}`}>
                  <button>View Details</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
