import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ItineraryEditor() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState({
    title: '',
    destination: '',
    notes: '',
    startDate: '',
    endDate: '',
  });

  const save = () => {
    console.log('Itinerary saved:', itinerary);
    alert('Itinerary saved (placeholder).');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Itinerary Editor</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Title: <input value={itinerary.title} onChange={(e) => setItinerary({...itinerary, title: e.target.value})} /></label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Destination: <input value={itinerary.destination} onChange={(e) => setItinerary({...itinerary, destination: e.target.value})} /></label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Start: <input type="date" value={itinerary.startDate} onChange={(e) => setItinerary({...itinerary, startDate: e.target.value})} /></label>
        <label style={{ marginLeft: '1rem' }}>End: <input type="date" value={itinerary.endDate} onChange={(e) => setItinerary({...itinerary, endDate: e.target.value})} /></label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Notes:</label>
        <br />
        <textarea value={itinerary.notes} onChange={(e) => setItinerary({...itinerary, notes: e.target.value})} rows={6} style={{ width: '100%' }} />
      </div>

      <button onClick={save}>Save Itinerary</button>

      <div style={{ marginTop: '1rem' }}>
        <Link href="/"><button>Back Home</button></Link>
      </div>
    </div>
  );
}
