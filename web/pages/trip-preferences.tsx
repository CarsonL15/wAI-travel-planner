import { useState } from 'react';
import Link from 'next/link';

export default function TripPreferences() {
  const [prefs, setPrefs] = useState({
    interests: '',
    budget: '',
    people: 1,
    tripPace: [] as string[],
    travelStyle: '',
  });

  const paceOptions = ['Relaxed', 'Moderate', 'Fast-paced', 'Busy'];

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
        <label>How many people:
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

      <button onClick={save}>Save Preferences</button>

      <div style={{ marginTop: '1rem' }}>
        <Link href="/"><button>Back Home</button></Link>
      </div>
    </div>
  );
}
