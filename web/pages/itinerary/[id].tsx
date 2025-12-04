import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getItinerary } from '../../lib/api';
import { isAuthenticated } from '../../lib/auth';

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

export default function ItineraryDetail() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    checkAuth();
    if (id) {
      loadItinerary(id as string);
    }
  }, [id]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/');
    }
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

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'museum': return '🏛️';
      case 'outdoors': return '🌳';
      case 'shopping': return '🛍️';
      default: return '📍';
    }
  };

  const getCostBandColor = (costBand: string) => {
    switch (costBand) {
      case 'low': return '#4CAF50';
      case 'med': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: '8px', color: '#DC2626' }}>
          {error}
        </div>
        <Link href="/">
          <button style={{ marginTop: '1rem' }}>← Back to Home</button>
        </Link>
      </div>
    );
  }

  if (!itinerary) {
    return <div>Itinerary not found</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/">
          <button>← Back to Home</button>
        </Link>
      </div>

      <h1>{itinerary.destination}</h1>
      <p>
        {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
      </p>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {itinerary.days.map((day, dayIndex) => (
          <div key={day.date} style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px' }}>
            <h2>Day {dayIndex + 1} - {new Date(day.date).toLocaleDateString()}</h2>
            {itinerary.rationalePerDay?.[dayIndex] && (
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                {itinerary.rationalePerDay[dayIndex]}
              </p>
            )}
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {day.blocks.map((block, blockIndex) => (
                <div
                  key={blockIndex}
                  style={{
                    border: '1px solid #eee',
                    padding: '1rem',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>
                      {getCategoryEmoji(block.category)} {block.title}
                    </h3>
                  </div>
                  
                  <p style={{ margin: '0.5rem 0', color: '#666' }}>
                    {block.start} - {block.end}
                  </p>
                  
                  <p style={{ margin: '0.5rem 0' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getCostBandColor(block.costBand),
                        color: 'white',
                        fontSize: '0.8em',
                        marginRight: '0.5rem',
                      }}
                    >
                      {block.costBand.toUpperCase()}
                    </span>
                    {block.category.toUpperCase()}
                  </p>
                  
                  {block.notes && (
                    <p style={{ margin: '0.5rem 0', fontStyle: 'italic' }}>
                      {block.notes}
                    </p>
                  )}
                  
                  {block.address && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.9em', color: '#666' }}>
                      📍 {block.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px' }}>
        <h2>Packing List</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {itinerary.packingList.map((item, index) => (
            <li key={index} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              ☑️ {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
