import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, getCurrentUser, signOut, signIn, signUp, confirmSignUp } from '../lib/auth';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const LeafletWorldMap = dynamic(() => import('../components/LeafletWorldMap'), {
  ssr: false,
});

const INTEREST_OPTIONS = [
  { id: 'hiking', label: '🥾 Hiking & Outdoors', category: 'activity' },
  { id: 'nightlife', label: '🎉 Nightlife & Clubbing', category: 'activity' },
  { id: 'food', label: '🍽️ Food & Dining', category: 'activity' },
  { id: 'museums', label: '🏛️ Museums & Culture', category: 'activity' },
  { id: 'beaches', label: '🏖️ Beaches & Relaxation', category: 'activity' },
  { id: 'shopping', label: '🛍️ Shopping', category: 'activity' },
  { id: 'adventure', label: '🏔️ Adventure Sports', category: 'activity' },
  { id: 'photography', label: '📸 Photography', category: 'activity' },
  { id: 'history', label: '📚 Historical Sites', category: 'activity' },
  { id: 'nature', label: '🌿 Nature & Wildlife', category: 'activity' },
];

const TRAVEL_STYLE_OPTIONS = [
  { id: 'luxury', label: '💎 Luxury', description: 'High-end hotels, fine dining' },
  { id: 'budget', label: '💰 Budget-Friendly', description: 'Hostels, local spots' },
  { id: 'balanced', label: '⚖️ Balanced', description: 'Mix of comfort and value' },
  { id: 'backpacker', label: '🎒 Backpacker', description: 'Adventurous, minimal' },
];

const PACE_OPTIONS = [
  { id: 'relaxed', label: '🌅 Relaxed', description: 'Slow pace, lots of downtime' },
  { id: 'moderate', label: '👣 Moderate', description: 'Balanced schedule' },
  { id: 'fast', label: '⚡ Fast-Paced', description: 'Pack in as much as possible' },
];

export default function Home() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Login/Signup form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  
  // Create account multi-step states
  const [createAccountStep, setCreateAccountStep] = useState<'credentials' | 'preferences' | 'confirmation'>('credentials');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState<string>('');
  const [pace, setPace] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await isAuthenticated();
    setAuthenticated(isAuth);
    if (isAuth) {
      try {
        const user = await getCurrentUser();
        setUserEmail(user.email);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }
  };

  const handleLogout = () => {
    signOut();
    setAuthenticated(false);
    setUserEmail(null);
    router.push('/');
  };

  const handleCountryClick = (countryName: string) => {
    setSearchQuery(countryName);
    setSelectedCountry(countryName);
  };

  const handleDestinationSelect = async (destination: string) => {
    setSelectedDestination(destination);
    
    const isAuth = await isAuthenticated();
    if (isAuth) {
      router.push(`/trip-preferences?destination=${encodeURIComponent(destination)}`);
    } else {
      setShowAuthPrompt(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleDestinationSelect(searchQuery);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      await checkAuth();
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (createAccountStep === 'credentials') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setCreateAccountStep('preferences');
      return;
    }
    
    if (createAccountStep === 'preferences') {
      if (selectedInterests.length === 0) {
        setError('Please select at least one interest');
        return;
      }
      if (!travelStyle || !pace) {
        setError('Please select travel style and pace');
        return;
      }
      
      setLoading(true);
      try {
        await signUp(email, password, name);
        setCreateAccountStep('confirmation');
        alert('Account created! Please check your email for a verification code.');
      } catch (err: any) {
        setError(err.message || 'Sign up failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUp(email, confirmationCode);
      await signIn(email, password);
      
      // Save preferences to DynamoDB
      const token = localStorage.getItem('idToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({
          interests: selectedInterests,
          travelStyle,
          pace,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      await checkAuth();
      setShowCreateAccountModal(false);
      setCreateAccountStep('credentials');
      setEmail('');
      setPassword('');
      setName('');
      setConfirmationCode('');
      setSelectedInterests([]);
      setTravelStyle('');
      setPace('');
      alert('Account confirmed! Welcome to wAI Travel Planner.');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh', 
      overflow: 'hidden', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Auth Status Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}>
          wAI Travel Planner
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {authenticated ? (
            <>
              <span style={{ 
                color: 'white', 
                fontSize: '0.9rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}>
                ✓ Logged in as {userEmail}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '0.9rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}>
                Not logged in
              </span>
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>

      {/* Full-screen Map Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        <LeafletWorldMap
          onCountryClick={handleCountryClick}
          onCountryHover={setHoveredCountry}
          selectedCountry={selectedCountry}
        />
      </div>

      {/* Top Section - Welcome & Search */}
      {!showAuthPrompt && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            zIndex: 10,
            pointerEvents: 'auto',
            padding: '2rem 2rem 3rem',
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'white',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            <h1
              style={{
                fontSize: '3.5rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                letterSpacing: '-1px',
                color: 'white',
              }}
            >
              Welcome explorer, lead the wAI
            </h1>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} style={{ marginTop: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  maxWidth: '600px',
                  margin: '0 auto',
                  backgroundColor: 'white',
                  borderRadius: '50px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Only clear selected country if user is typing something different
                    if (e.target.value !== selectedCountry) {
                      setSelectedCountry(null);
                    }
                  }}
                  placeholder={hoveredCountry || "Search for a city or country..."}
                  style={{
                    flex: 1,
                    padding: '1.25rem 2rem',
                    border: 'none',
                    fontSize: '1.1rem',
                    outline: 'none',
                    color: '#333',
                    backgroundColor: 'transparent',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '1.25rem 2.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Explore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthPrompt && selectedDestination && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '3rem',
              maxWidth: '500px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✈️</div>
              <h2
                style={{
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  color: '#1f2937',
                  fontWeight: '700',
                }}
              >
                Ready to explore {selectedDestination}?
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem' }}>
                Sign in or create an account to start planning your perfect itinerary with AI
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                    setShowCreateAccountModal(true);
                  }}
                  style={{
                    padding: '1.25rem 2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  Create Account
                </button>

                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                    setShowLoginModal(true);
                  }}
                  style={{
                    padding: '1.25rem 2rem',
                    backgroundColor: 'transparent',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#EEF2FF';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Sign In
                </button>

                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                    setSelectedDestination(null);
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    border: 'none',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#6b7280')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  Choose a different destination
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '3rem',
              maxWidth: '600px',
              width: '90vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => {
                setShowLoginModal(false);
                setError('');
                setEmail('');
                setPassword('');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '0.5rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '700' }}>
                Welcome Back
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
                required
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
                required
                minLength={8}
              />

              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setShowCreateAccountModal(true);
                  setError('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#667eea',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateAccountModal && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '3rem',
              maxWidth: '800px',
              width: '90vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => {
                setShowCreateAccountModal(false);
                setCreateAccountStep('credentials');
                setError('');
                setEmail('');
                setPassword('');
                setName('');
                setConfirmationCode('');
                setSelectedInterests([]);
                setTravelStyle('');
                setPace('');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '0.5rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Progress Indicator */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: createAccountStep === 'credentials' ? '#667eea' : '#d1d5db' }} />
              <div style={{ width: '48px', height: '4px', backgroundColor: '#d1d5db' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: createAccountStep === 'preferences' ? '#667eea' : '#d1d5db' }} />
              <div style={{ width: '48px', height: '4px', backgroundColor: '#d1d5db' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: createAccountStep === 'confirmation' ? '#667eea' : '#d1d5db' }} />
            </div>

            {/* Step 1: Credentials */}
            {createAccountStep === 'credentials' && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '700' }}>
                    Create Your Account
                  </h2>
                  <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                    Let's start with the basics
                  </p>
                </div>

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                      required
                      minLength={8}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      At least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Next: Set Your Preferences
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setShowCreateAccountModal(false);
                      setShowLoginModal(true);
                      setError('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#667eea',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Preferences */}
            {createAccountStep === 'preferences' && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '700' }}>
                    Tell Us About Your Travel Style
                  </h2>
                  <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                    Select your interests so we can personalize your itineraries
                  </p>
                </div>

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Interests */}
                  <div>
                    <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                      What are you interested in?
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {INTEREST_OPTIONS.map(interest => (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest.id)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: selectedInterests.includes(interest.id) ? '2px solid #667eea' : '2px solid #e5e7eb',
                            backgroundColor: selectedInterests.includes(interest.id) ? '#eff6ff' : 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{interest.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Style */}
                  <div>
                    <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                      Travel Style
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {TRAVEL_STYLE_OPTIONS.map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setTravelStyle(style.id)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '8px',
                            border: travelStyle === style.id ? '2px solid #667eea' : '2px solid #e5e7eb',
                            backgroundColor: travelStyle === style.id ? '#eff6ff' : 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{style.label}</div>
                          <div style={{ fontSize: '14px', color: '#4b5563' }}>{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pace */}
                  <div>
                    <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                      Travel Pace
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {PACE_OPTIONS.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPace(p.id)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '8px',
                            border: pace === p.id ? '2px solid #667eea' : '2px solid #e5e7eb',
                            backgroundColor: pace === p.id ? '#eff6ff' : 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{p.label}</div>
                          <div style={{ fontSize: '14px', color: '#4b5563' }}>{p.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateAccountStep('credentials');
                        setError('');
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#e5e7eb',
                        color: '#1f2937',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: Confirmation */}
            {createAccountStep === 'confirmation' && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '700' }}>
                    Verify Your Email
                  </h2>
                  <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        letterSpacing: '0.2em',
                      }}
                      maxLength={6}
                      required
                    />
                  </div>

                  {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    {loading ? 'Confirming...' : 'Verify & Start Planning'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
