import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { useTrip } from '@/context/TripContext';

interface TripPreferences {
  location: string;
  duration: number;
  groupSize: number;
  interests: string[];
  attractionType: 'popular' | 'hidden-gems' | 'cultural' | 'nature' | 'mixed';
  budget: 'budget' | 'moderate' | 'luxury';
  tripPace: 'relaxed' | 'moderate' | 'intense';
  travelStyle: string;
  mustSeeAttractions: string[];
}

interface Activity {
  id: string;
  time: string;
  name: string;
  description: string;
  duration: string;
  cost: string;
  type: string;
}

interface DayPlan {
  date: string;
  activities: Activity[];
}

interface DayType {
  id: string;
  name: string;
  emoji: string;
}

interface PastItinerary {
  id: string;
  destination: string;
  date: string;
}

export default function ItineraryEditor() {
  const router = useRouter();
  const { user } = useUser();
  const { prefs: tripCtxPrefs, setPrefs } = useTrip();
  const [preferences, setPreferences] = useState<TripPreferences | null>(null);
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [geminiRaw, setGeminiRaw] = useState<string | null>(null);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [showDayTypeModal, setShowDayTypeModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedDayTypes, setSelectedDayTypes] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState('');
  const [activityType, setActivityType] = useState<'place' | 'activity' | null>(null);
  const [pastItineraries, setPastItineraries] = useState<PastItinerary[]>([]);

  useEffect(() => {
    // Mock past itineraries - replace with actual API call
    setPastItineraries([
      { id: '1', destination: 'Zurich, Switzerland', date: '2025-09-15' },
      { id: '2', destination: 'Tokyo, Japan', date: '2025-08-01' },
    ]);
  }, []);

  const dayTypes: DayType[] = [
    { id: 'outdoorsy', name: 'Outdoorsy', emoji: '🌲' },
    { id: 'relaxing', name: 'Relaxing', emoji: '🌅' },
    { id: 'adventurous', name: 'Adventurous', emoji: '🏃' },
    { id: 'cultural', name: 'Cultural', emoji: '🏛️' },
    { id: 'foodie', name: 'Foodie', emoji: '🍽️' },
    { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
    { id: 'nightlife', name: 'Nightlife', emoji: '🌙' },
    { id: 'family', name: 'Family-Friendly', emoji: '👨‍👩‍👧‍👦' },
    { id: 'romantic', name: 'Romantic', emoji: '💑' },
    { id: 'surprise', name: 'Surprise Me!', emoji: '✨' }
  ];

  useEffect(() => {
    if (tripCtxPrefs) {
      // If the context already contains a generated itinerary, use it and don't call the AI again.
      if (tripCtxPrefs.generatedItinerary && Array.isArray(tripCtxPrefs.generatedItinerary) && tripCtxPrefs.generatedItinerary.length > 0) {
        const mappedFromCtx: TripPreferences = {
          location: tripCtxPrefs.destination || 'Unknown',
          duration: tripCtxPrefs.duration,
          groupSize: tripCtxPrefs.people,
          interests: tripCtxPrefs.interests ? tripCtxPrefs.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
          attractionType: (tripCtxPrefs.attractionType?.[0] || 'mixed') as any,
          budget: (tripCtxPrefs.budget || 'moderate') as any,
          tripPace: (tripCtxPrefs.tripPace?.[0] || 'moderate') as any,
          travelStyle: tripCtxPrefs.travelStyle || 'cultural',
          mustSeeAttractions: tripCtxPrefs.placesWanted ? tripCtxPrefs.placesWanted.split(',').map(s => s.trim()).filter(Boolean) : [],
        };
        setPreferences(mappedFromCtx);
        // Use generated itinerary from context
        setItinerary(tripCtxPrefs.generatedItinerary as DayPlan[]);
        setGeminiRaw(tripCtxPrefs.aiRaw ?? null);
        setLoading(false);
        return;
      }

      const mapped: TripPreferences = {
        location: tripCtxPrefs.destination || 'Unknown',
        duration: tripCtxPrefs.duration,
        groupSize: tripCtxPrefs.people,
        interests: tripCtxPrefs.interests ? tripCtxPrefs.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        attractionType: (tripCtxPrefs.attractionType[0] || 'mixed') as any,
        budget: (tripCtxPrefs.budget || 'moderate') as any,
        tripPace: (tripCtxPrefs.tripPace[0] || 'moderate') as any,
        travelStyle: tripCtxPrefs.travelStyle || 'cultural',
        mustSeeAttractions: tripCtxPrefs.placesWanted ? tripCtxPrefs.placesWanted.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      setPreferences(mapped);
      generateInitialItinerary(mapped);
      return;
    }

    // fallback mock
    const mockPreferences: TripPreferences = {
      location: "Paris, France",
      duration: 5,
      groupSize: 2,
      interests: ["art", "food", "history"],
      attractionType: "mixed",
      budget: "moderate",
      tripPace: "moderate",
      travelStyle: "cultural",
      mustSeeAttractions: ["Eiffel Tower", "Louvre"]
    };
    setPreferences(mockPreferences);
    generateInitialItinerary(mockPreferences);
  }, [tripCtxPrefs]);

  const generateInitialItinerary = async (prefs: TripPreferences) => {
    setIsGenerating(true);
    try {
      // Call our API which proxies to Gemini
      const resp = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs })
      });

      const json = await resp.json();
      if (!resp.ok) {
        console.error('API error', json);
        throw new Error(json?.error || 'Failed to generate itinerary');
      }

      // Save raw model output for inspection
      setGeminiRaw(json.raw || null);

      // Persist generated itinerary and raw output into TripContext
      try {
  const base = (tripCtxPrefs as any) || {};
        const constructed = {
          tripName: base.tripName,
          destination: base.destination || tripCtxPrefs?.destination || prefs.location || preferences?.location,
          interests: base.interests ?? (prefs ? prefs.interests.join(',') : (preferences ? preferences.interests.join(',') : '')),
          placesWanted: base.placesWanted ?? (prefs ? prefs.mustSeeAttractions.join(',') : (preferences ? preferences.mustSeeAttractions.join(',') : '')),
          attractionType: base.attractionType ?? (prefs ? [prefs.attractionType as string] : ['mixed']),
          budget: base.budget ?? (prefs ? prefs.budget : 'moderate'),
          people: base.people ?? (prefs ? prefs.groupSize : 1),
          duration: base.duration ?? (prefs ? prefs.duration : 1),
          tripPace: base.tripPace ?? (prefs ? [prefs.tripPace as string] : ['moderate']),
          travelStyle: base.travelStyle ?? (prefs ? prefs.travelStyle : ''),
          // attach AI outputs
          generatedItinerary: json.itinerary ?? null,
          aiRaw: json.raw ?? null,
        } as any;

        setPrefs(constructed);
      } catch (e) {
        console.warn('Failed to save generated itinerary to context', e);
      }

      // If API returned parsed itinerary, set it. Otherwise, keep mock fallback.
      if (json.itinerary && Array.isArray(json.itinerary)) {
        setItinerary(json.itinerary as DayPlan[]);
      } else {
        console.warn('API returned no itinerary array, using mock fallback');
      }
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const regenerateDay = async (dayIndex: number) => {
    setSelectedDayTypes([]); // Reset selections
    setShowDayTypeModal(true);
  };

  const handleDayTypeSelection = (typeId: string) => {
    setSelectedDayTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleRegenerateDayConfirm = async () => {
    if (selectedDayTypes.length === 0) {
      alert('Please select at least one day type');
      return;
    }
    
    setIsGenerating(true);
    try {
      const resp = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          mode: 'regenerateDay',
          dayIndex: selectedDay,
          dayTypes: selectedDayTypes
        })
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'API error');

      setGeminiRaw(json.raw || null);
      const [newDayPlan] = json.itinerary as DayPlan[];
      setItinerary(current => {
        const updated = [...current];
        updated[selectedDay] = newDayPlan;

        // Update TripContext with the modified itinerary and raw output
        try {
          const base = (tripCtxPrefs as any) || {};
          const constructed = {
            tripName: base.tripName,
            destination: base.destination || tripCtxPrefs?.destination || preferences?.location,
            interests: base.interests ?? (preferences ? preferences.interests.join(',') : ''),
            placesWanted: base.placesWanted ?? (preferences ? preferences.mustSeeAttractions.join(',') : ''),
            attractionType: base.attractionType ?? (preferences ? [preferences.attractionType as string] : ['mixed']),
            budget: base.budget ?? (preferences ? preferences.budget : 'moderate'),
            people: base.people ?? (preferences ? preferences.groupSize : 1),
            duration: base.duration ?? (preferences ? preferences.duration : 1),
            tripPace: base.tripPace ?? (preferences ? [preferences.tripPace as string] : ['moderate']),
            travelStyle: base.travelStyle ?? (preferences ? preferences.travelStyle : ''),
            generatedItinerary: updated,
            aiRaw: json.raw ?? null,
          } as any;
          setPrefs(constructed);
        } catch (e) {
          console.warn('Failed to save regenerated itinerary to context', e);
        }

        return updated;
      });
    } catch (error) {
      console.error('Failed to regenerate day:', error);
      alert('Failed to regenerate day. See console for details.');
    } finally {
      setIsGenerating(false);
      setShowDayTypeModal(false);
      setSelectedDayTypes([]); // Reset selections
    }
  };

  const addActivity = async (dayIndex: number) => {
    setActivityInput('');
    setActivityType(null);
    setShowActivityModal(true);
  };

  const handleAddActivity = async () => {
    if (!activityType || !activityInput.trim()) {
      alert('Please select a type and enter your request');
      return;
    }

    setIsGenerating(true);
    try {
      // Here you would call your AI service with activityType and activityInput
      const newActivity: Activity = {
        id: `${selectedDay}-${Date.now()}`,
        time: "12:00", // AI would determine best time
        name: activityInput,
        description: `Added ${activityType}: ${activityInput}`,
        duration: "2 hours", // AI would determine duration
        cost: "€€", // AI would estimate cost
        type: activityType
      };

      // Update the itinerary with the new activity
      setItinerary(current => {
        const updated = [...current];
        updated[selectedDay] = {
          ...updated[selectedDay],
          activities: [...updated[selectedDay].activities, newActivity]
        };
        return updated;
      });

      setShowActivityModal(false);
      setActivityInput('');
      setActivityType(null);
    } catch (error) {
      console.error('Failed to add activity:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div>Loading your perfect itinerary...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      {/* <Header /> */}
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', paddingTop: '5rem' }}>
        {/* Trip Overview */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Your Trip to {preferences?.location}
          </h1>
          <p style={{ color: '#666' }}>
            {preferences?.duration} days • {preferences?.groupSize} people • 
            {preferences?.budget} budget • {preferences?.tripPace} pace
          </p>
        </div>

        {/* Day Selection */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          overflowX: 'auto',
          padding: '0.5rem 0'
        }}>
          {itinerary.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: selectedDay === index ? '#3B82F6' : 'white',
                color: selectedDay === index ? 'white' : '#374151',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Day {index + 1}
            </button>
          ))}
        </div>

        {/* Selected Day's Itinerary */}
        {itinerary[selectedDay] && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Day {selectedDay + 1} - {new Date(itinerary[selectedDay].date).toLocaleDateString()}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => regenerateDay(selectedDay)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Regenerate Day
                </button>
                <button
                  onClick={() => addActivity(selectedDay)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add Activity
                </button>
              </div>
            </div>

            {/* Activities Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {itinerary[selectedDay].activities.map((activity) => (
                <div 
                  key={activity.id}
                  style={{
                    display: 'flex',
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ width: '6rem', color: '#6B7280' }}>
                    {activity.time}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '500', color: '#111827' }}>{activity.name}</h3>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{activity.description}</p>
                    <div style={{ 
                      marginTop: '0.5rem',
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#6B7280'
                    }}>
                      <span>⏱ {activity.duration}</span>
                      <span>💰 {activity.cost}</span>
                      <span>🏷 {activity.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={() => router.push('/', undefined, { shallow: true })}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Back Home
          </button>
        </div>
        {/* Raw AI output viewer */}
        {geminiRaw && (
          <div style={{ marginTop: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>AI raw response</strong>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setShowRawOutput(s => !s)}
                  style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#F3F4F6', cursor: 'pointer' }}
                >
                  {showRawOutput ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => { navigator.clipboard?.writeText(geminiRaw); }}
                  style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#E5E7EB', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>
            </div>
            {showRawOutput && (
              <pre style={{ marginTop: '0.75rem', maxHeight: '300px', overflow: 'auto', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.375rem' }}>
                {geminiRaw}
              </pre>
            )}
          </div>
        )}

        {/* Activity Modal */}
        {showActivityModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Add New Activity
              </h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Type:
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setActivityType('place')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: activityType === 'place' ? '#3B82F6' : '#F3F4F6',
                      color: activityType === 'place' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    Place 📍
                  </button>
                  <button
                    onClick={() => setActivityType('activity')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: activityType === 'activity' ? '#3B82F6' : '#F3F4F6',
                      color: activityType === 'activity' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    Activity 🎯
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Description:
                </label>
                <textarea
                  value={activityInput}
                  onChange={(e) => setActivityInput(e.target.value)}
                  placeholder={activityType === 'place' ? 
                    "Enter a place name or address..." : 
                    "Describe the activity you'd like to do..."}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid #E5E7EB',
                paddingTop: '1rem'
              }}>
                <button
                  onClick={() => {
                    setShowActivityModal(false);
                    setActivityInput('');
                    setActivityType(null);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddActivity}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: activityType && activityInput.trim() ? '#3B82F6' : '#93C5FD',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: activityType && activityInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Day Type Selection Modal */}
        {showDayTypeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                What kind of day are you looking for?
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '0.75rem',
                marginBottom: '2rem'
              }}>
                {dayTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleDayTypeSelection(type.id)}
                    style={{
                      padding: '0.75rem',
                      border: selectedDayTypes.includes(type.id) 
                        ? '2px solid #3B82F6' 
                        : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      backgroundColor: selectedDayTypes.includes(type.id)
                        ? '#EBF5FF'
                        : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{type.emoji}</span>
                    <span style={{ 
                      fontSize: '0.875rem',
                      color: selectedDayTypes.includes(type.id) ? '#1E40AF' : '#374151'
                    }}>
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid #E5E7EB',
                paddingTop: '1rem'
              }}>
                <button
                  onClick={() => {
                    setShowDayTypeModal(false);
                    setSelectedDayTypes([]);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateDayConfirm}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: selectedDayTypes.length > 0 ? '#3B82F6' : '#93C5FD',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: selectedDayTypes.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
