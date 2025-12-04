import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, getCurrentUser, signOut } from '../lib/auth';
import { THEME } from '../lib/constants';
import dynamic from 'next/dynamic';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';
import AuthPromptModal from '../components/AuthPromptModal';

// Dynamic import to avoid SSR issues with Leaflet
const LeafletWorldMap = dynamic(() => import('../components/LeafletWorldMap'), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      } catch {
        // User not found, stay logged out
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

  const handleAuthSuccess = () => {
    checkAuth();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: THEME.gradient,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Auth Status Bar */}
      <div
        style={{
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
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          wAI Travel Planner
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {authenticated ? (
            <>
              <span
                style={{
                  color: 'white',
                  fontSize: '0.9rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
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
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
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
          <div
            style={{
              textAlign: 'center',
              color: 'white',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
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
                    if (e.target.value !== selectedCountry) {
                      setSelectedCountry(null);
                    }
                  }}
                  placeholder={hoveredCountry || 'Search for a city or country...'}
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
                    background: THEME.gradient,
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
        <AuthPromptModal
          destination={selectedDestination}
          onCreateAccount={() => {
            setShowAuthPrompt(false);
            setShowSignupModal(true);
          }}
          onSignIn={() => {
            setShowAuthPrompt(false);
            setShowLoginModal(true);
          }}
          onCancel={() => {
            setShowAuthPrompt(false);
            setSelectedDestination(null);
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToSignup={() => setShowSignupModal(true)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
          onSwitchToLogin={() => setShowLoginModal(true)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
