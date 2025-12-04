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
      router.push('/login');
    }
  };

  const loadItinerary = async (itineraryId: string) => {
    try {
      const data = await getItinerary(itineraryId);
      setItinerary(data);
    } catch (error) {
      console.error('Error loading itinerary:', error);
      alert('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  // Keep this mock as fallback if needed
  const loadMockItinerary = async (itineraryId: string) => {
    setItinerary({
      id: itineraryId,
      destination: 'Tokyo, Japan',
      startDate: '2024-03-15',
      endDate: '2024-03-22',
      days: [
        {
          date: '2024-03-15',
          blocks: [
            {
              start: '09:00',
              end: '11:00',
              title: 'Senso-ji Temple',
              category: 'museum',
              costBand: 'low',
              notes: 'Traditional Buddhist temple in Asakusa',
              address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
              lat: 35.7148,
              lon: 139.7967,
            },
            {
              start: '12:00',
              end: '13:30',
              title: 'Lunch at Tsukiji Outer Market',
              category: 'food',
              costBand: 'med',
              notes: 'Fresh sushi and local delicacies',
              address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo',
              lat: 35.6654,
              lon: 139.7706,
            },
          ],
        },
        {
          date: '2024-03-16',
          blocks: [
            {
              start: '10:00',
              end: '16:00',
              title: 'Tokyo Disneyland',
              category: 'other',
              costBand: 'high',
              notes: 'Full day at the magical theme park',
              address: '1-1 Maihama, Urayasu, Chiba',
              lat: 35.6329,
              lon: 139.8804,
            },
          ],
        },
      ],
      packingList: [
        'Comfortable walking shoes',
        'Light jacket for spring weather',
        'Universal power adapter',
        'Portable WiFi or SIM card',
        'Travel guidebook',
        'Camera or smartphone',
      ],
      rationalePerDay: [
        'Day 1 focuses on traditional Tokyo culture with Senso-ji Temple and authentic local food at Tsukiji Market.',
        'Day 2 is dedicated to entertainment and fun at Tokyo Disneyland, perfect for families or Disney enthusiasts.',
      ],
    });
    setLoading(false);
  };

  const rateActivity = async (blockId: string, rating: 'up' | 'down') => {
    try {
      // TODO: Call GraphQL mutation to rate activity
      console.log(`Rating activity ${blockId}: ${rating}`);
      alert(`Activity rated ${rating}! (TODO: Implement actual rating)`);
    } catch (error) {
      console.error('Error rating activity:', error);
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

  if (!itinerary) {
    return <div>Itinerary not found</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard">
          <button>← Back to Dashboard</button>
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
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              {itinerary.rationalePerDay[dayIndex]}
            </p>
            
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>
                      {getCategoryEmoji(block.category)} {block.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => rateActivity(`${day.date}-${blockIndex}`, 'up')}
                        style={{ background: 'none', border: 'none', fontSize: '1.2em' }}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => rateActivity(`${day.date}-${blockIndex}`, 'down')}
                        style={{ background: 'none', border: 'none', fontSize: '1.2em' }}
                      >
                        👎
                      </button>
                    </div>
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
