import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { generateItinerary } from '../lib/api';
import { isAuthenticated, getCurrentUser, signOut } from '../lib/auth';
import { THEME, MAX_TRIP_DAYS } from '../lib/constants';

export default function TripPlanner() {
  const router = useRouter();
  const { destination } = router.query;
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Essential trip details
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState('');
  const [people, setPeople] = useState(1);
  const [destinationInput, setDestinationInput] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      router.push('/');
      return;
    }
    setAuthenticated(isAuth);
    try {
      const user = await getCurrentUser();
      setUserEmail(user.email);
    } catch {
      // User fetch failed, continue anyway
    }
  };

  useEffect(() => {
    if (destination) {
      setDestinationInput(destination as string);
      setTripName(`Trip to ${destination}`);
    }
  }, [destination]);

  const handleLogout = () => {
    signOut();
    setAuthenticated(false);
    setUserEmail(null);
    router.push('/');
  };

  const generateTrip = async () => {
    setError(null);

    if (!destinationInput.trim()) {
      setError('Please enter a destination');
      return;
    }

    if (!budget) {
      setError('Please select a budget');
      return;
    }

    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    setLoading(true);
    try {
      const result = await generateItinerary({
        destination: destinationInput,
        duration: duration,
        budget: budget,
        startDate: startDate,
        interests: [],
      });

      router.push(`/itinerary/${result.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate itinerary: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const durationPercent = Math.round(((duration - 1) / (MAX_TRIP_DAYS - 1)) * 100);

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header with auth status */}
      <div className="relative z-10 p-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.9)';
            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          <span className="text-xl">←</span>
          <span>Back to Map</span>
        </button>
        {authenticated && userEmail && (
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        <div 
          className="rounded-3xl shadow-2xl p-8 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-4xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ✈️ Plan Your Trip
            </h1>
            <p className="text-gray-600">
              Tell us about your journey and we'll create the perfect itinerary
            </p>
          </div>

          <div className="space-y-6">
            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#581C87' }}>
                Where are you going? ✨
              </label>
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                placeholder="e.g., Paris, Tokyo, New York..."
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200"
                style={{
                  fontSize: '16px',
                  borderColor: destinationInput ? '#9333EA' : '#E9D5FF',
                  backgroundColor: '#FAFAFA'
                }}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#581C87' }}>
                When do you want to go? 📅
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200"
                style={{
                  fontSize: '16px',
                  borderColor: startDate ? '#9333EA' : '#E9D5FF',
                  backgroundColor: '#FAFAFA'
                }}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#581C87' }}>
                How long is your trip? ⏱️
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold" style={{ color: '#9333EA' }}>
                  {duration} {duration === 1 ? 'day' : 'days'}
                </span>
                <span className="text-sm text-gray-500">
                  1-14 days
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #9333EA 0%, #9333EA ${durationPercent}%, #E9D5FF ${durationPercent}%, #E9D5FF 100%)`
                }}
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#581C87' }}>
                What's your budget? 💰
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200"
                style={{
                  fontSize: '16px',
                  borderColor: budget ? '#9333EA' : '#E9D5FF',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <option value="">Select your budget level...</option>
                <option value="budget">💵 Budget-Friendly</option>
                <option value="moderate">💳 Moderate</option>
                <option value="comfortable">💎 Comfortable</option>
                <option value="luxury">👑 Luxury</option>
              </select>
            </div>

            {/* Number of Travelers */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#581C87' }}>
                How many travelers? 👥
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPeople(num)}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: people === num ? '#9333EA' : '#F3E8FF',
                      color: people === num ? 'white' : '#581C87',
                      border: people === num ? 'none' : '2px solid #E9D5FF'
                    }}
                  >
                    {num}
                  </button>
                ))}
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={people > 4 ? people : ''}
                  onChange={(e) => setPeople(parseInt(e.target.value) || 5)}
                  placeholder="5+"
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-center border-2 focus:outline-none"
                  style={{
                    fontSize: '16px',
                    borderColor: people > 4 ? '#9333EA' : '#E9D5FF',
                    backgroundColor: people > 4 ? '#9333EA' : '#F3E8FF',
                    color: people > 4 ? 'white' : '#581C87'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '0.5rem',
                color: '#DC2626',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateTrip}
            disabled={loading || !budget || !destinationInput || !startDate}
            className="w-full mt-8 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            style={{
              background: loading || !budget || !destinationInput || !startDate 
                ? '#D8B4FE' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              cursor: loading || !budget || !destinationInput || !startDate ? 'not-allowed' : 'pointer',
              opacity: loading || !budget || !destinationInput || !startDate ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none" 
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                  />
                </svg>
                Generating Your Perfect Itinerary...
              </span>
            ) : (
              'Generate My Trip'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
