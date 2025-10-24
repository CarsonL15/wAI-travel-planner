import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';

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
  const [preferences, setPreferences] = useState<TripPreferences | null>(null);
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDayTypeModal, setShowDayTypeModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedDayTypes, setSelectedDayTypes] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState('');
  const [activityType, setActivityType] = useState<'place' | 'activity' | null>(null);
  const [pastItineraries, setPastItineraries] = useState<PastItinerary[]>([]);

  useEffect(() => {
    // Mock past itineraries - replace with actual API call
    setPastItineraries([
      { id: '1', destination: 'Paris, France', date: '2025-09-15' },
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
    // In a real app, fetch preferences from your backend/context
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
  }, []);

  const generateInitialItinerary = async (prefs: TripPreferences) => {
    setIsGenerating(true);
    try {
      // Here you would call your AI service
      // For now, let's mock the response
      const mockItinerary: DayPlan[] = Array.from({ length: prefs.duration }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activities: [
          {
            id: `${i}-1`,
            time: "09:00",
            name: "Breakfast at Local Café",
            description: "Start your day with fresh croissants and coffee",
            duration: "1 hour",
            cost: "€15",
            type: "food"
          },
          {
            id: `${i}-2`,
            time: "10:30",
            name: i === 0 ? "Eiffel Tower Visit" : "Museum Visit",
            description: "Explore the iconic landmark",
            duration: "2 hours",
            cost: "€30",
            type: "attraction"
          },
          // Add more activities as needed
        ]
      }));
      
      setItinerary(mockItinerary);
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
      // Here you would call your AI service with selectedDayTypes
      console.log('Regenerating day with types:', selectedDayTypes);
      // Mock regeneration for now
      alert('This would regenerate day ' + (selectedDay + 1) + ' with types: ' + 
        selectedDayTypes.map(id => dayTypes.find(t => t.id === id)?.name).join(', '));
    } catch (error) {
      console.error('Failed to regenerate day:', error);
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
