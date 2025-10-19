import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useTrip } from '@/context/TripContext';

export default function TripPreferences() {
  const router = useRouter();
  const { destination } = router.query;
  const [tripName, setTripName] = useState('');
  
  const [prefs, setPrefs] = useState({
    interests: '',
    placesWanted: '',
    attractionType: [] as string[],
    budget: '',
    people: 1,
    duration: 3,
    tripPace: [] as string[],
    travelStyle: '',
  });
  const { setPrefs: setTripPrefs } = useTrip();

  const paceOptions = ['Relaxed', 'Moderate', 'Fast-paced', 'Busy'];
  const attractionOptions = ['Popular', 'Hidden gems', 'Cultural', 'Nature', 'Mixed'];

  const toggleAttraction = (option: string) => {
    setPrefs((prev) => {
      const has = prev.attractionType.includes(option);
      return {
        ...prev,
        attractionType: has ? prev.attractionType.filter((a) => a !== option) : [...prev.attractionType, option],
      };
    });
  };

  const togglePace = (option: string) => {
    setPrefs((prev) => {
      const has = prev.tripPace.includes(option);
      return {
        ...prev,
        tripPace: has ? prev.tripPace.filter((p) => p !== option) : [...prev.tripPace, option],
      };
    });
  };

  const save = () => {
    const tripData = {
      ...prefs,
      tripName,
      destination: destination || '',
    };
    console.log('Trip Data:', tripData);
    // Save into TripContext, then navigate to itinerary editor
    try {
      setTripPrefs({
        tripName: tripData.tripName,
        destination: String(tripData.destination || ''),
        interests: tripData.interests,
        placesWanted: tripData.placesWanted,
        attractionType: tripData.attractionType,
        budget: tripData.budget,
        people: tripData.people,
        duration: tripData.duration,
        tripPace: tripData.tripPace,
        travelStyle: tripData.travelStyle,
      });
    } catch (e) {
      console.warn('Failed to set trip prefs in context', e);
    }
    router.push('/itinerary-editor');
  };

  const durationPercent = Math.round(((prefs.duration - 1) / (14 - 1)) * 100);

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          padding: '2rem',
          maxWidth: 900,
          margin: '0 auto',
          backgroundColor: '#F3E8FF', // light purple background
          fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial",
          color: '#2b2340',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2346"
          alt="Mountains and forest"
          style={{ width: '100%', maxHeight: 1500, objectFit: 'cover', marginBottom: 16 }}
        />

        <h1 style={{ color: '#4B0082', marginBottom: 8 }}>
          {destination ? `Your trip to ${destination}` : 'Trip Preferences'}
        </h1>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
            Give your trip a name!
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g., Summer Adventure 2025"
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Duration (days): {prefs.duration}</label>
          <input
            type="range"
            min={1}
            max={14}
            value={prefs.duration}
            onChange={(e) => setPrefs({ ...prefs, duration: parseInt(e.target.value, 10) })}
            style={{ width: 320, maxWidth: '100%', ['--value' as any]: `${durationPercent}%` }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>
            How many people:
            <input
              type="number"
              min={1}
              value={prefs.people}
              onChange={(e) => {
                const v = parseInt(e.target.value || '1', 10);
                setPrefs({ ...prefs, people: Number.isNaN(v) ? 1 : v });
              }}
              style={{ marginLeft: 8, width: 80 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>Interests: <input placeholder="e.g. cafes, museums" value={prefs.interests} onChange={(e) => setPrefs({...prefs, interests: e.target.value})} /></label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Must-see attractions (optional)</label>
          <textarea
            placeholder="e.g. Pantheon, Colosseum, Sistine Chapel. Leave blank if none."
            value={prefs.placesWanted}
            onChange={(e) => setPrefs({ ...prefs, placesWanted: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 6 }}>Preferred attraction type (select one or more)</legend>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {attractionOptions.map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={prefs.attractionType.includes(opt)}
                    onChange={() => toggleAttraction(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>Budget:
            <select value={prefs.budget} onChange={(e) => setPrefs({...prefs, budget: e.target.value})} style={{ marginLeft: 8 }}>
              <option value="">Select</option>
              <option>Under $500</option>
              <option>$500 - $1,000</option>
              <option>$1,000 - $2,500</option>
              <option>Over $2,500</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 6 }}>Trip pace (select one or more):</legend>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {paceOptions.map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={prefs.tripPace.includes(opt)}
                    onChange={() => togglePace(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>Travel Style:
            <select value={prefs.travelStyle} onChange={(e) => setPrefs({...prefs, travelStyle: e.target.value})} style={{ marginLeft: 8 }}>
              <option value="">Select</option>
              <option>Budget</option>
              <option>Mid-range</option>
              <option>Luxury</option>
              <option>Adventure</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <button
            onClick={save}
            style={{
              backgroundColor: '#048a97',
              color: '#ffffff',
              padding: '16px 24px',
              border: 'none',
              borderRadius: 10,
              fontWeight: 400,
              fontSize: 20,
              boxShadow: '0 10px 30px rgba(4,138,151,0.18)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>Generate Itinerary</span>
            <span style={{ fontSize: 22 }}>💡</span>
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link href="/"><button>Back Home</button></Link>
        </div>
      </div>
    </>
  );
}
