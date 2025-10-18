import { useState } from 'react';
import Link from 'next/link';

export default function TripPreferences() {
  const [prefs, setPrefs] = useState({
    interests: '',
    travelStyle: '',
    budget: '',
  });

  const save = () => {
    console.log('Preferences:', prefs);
    alert('Preferences saved (placeholder).');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
      <h1>Trip Preferences</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Interests (comma separated): <input value={prefs.interests} onChange={(e) => setPrefs({...prefs, interests: e.target.value})} /></label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Travel Style:
          <select value={prefs.travelStyle} onChange={(e) => setPrefs({...prefs, travelStyle: e.target.value})} style={{ marginLeft: 8 }}>
            <option value="">Select</option>
            <option>Budget</option>
            <option>Mid-range</option>
            <option>Luxury</option>
            <option>Adventure</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Budget:
          <select value={prefs.budget} onChange={(e) => setPrefs({...prefs, budget: e.target.value})} style={{ marginLeft: 8 }}>
            <option value="">Select</option>
            <option>Under $500</option>
            <option>$500 - $1,000</option>
            <option>$1,000 - $2,500</option>
            <option>Over $2,500</option>
          </select>
        </label>
      </div>

      <button onClick={save}>Save Preferences</button>

      <div style={{ marginTop: '1rem' }}>
        <Link href="/"><button>Back Home</button></Link>
      </div>
    </div>
  );
}
