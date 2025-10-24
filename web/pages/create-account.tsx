import { useState } from 'react';
import { useRouter } from 'next/router';
import { signUp, confirmSignUp, signIn } from '../lib/auth';

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

export default function CreateAccount() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'preferences' | 'confirmation'>('credentials');
  
  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Step 2: Preferences
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState<string>('');
  const [pace, setPace] = useState<string>('');
  
  // Step 3: Confirmation
  const [confirmationCode, setConfirmationCode] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setStep('preferences');
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (selectedInterests.length === 0) {
      setError('Please select at least one interest');
      setLoading(false);
      return;
    }

    if (!travelStyle || !pace) {
      setError('Please select travel style and pace');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Cognito
      await signUp(email, password, name);
      setStep('confirmation');
      alert('Account created! Please check your email for a verification code.');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Confirm email with Cognito
      await confirmSignUp(email, confirmationCode);
      
      // Sign in to get token
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

      alert('Account confirmed! Redirecting to trip planning...');
      router.push('/trip-preferences');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        overflowY: 'auto',
      }}
      onClick={() => router.push('/')}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '3rem',
          maxWidth: '700px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          margin: '2rem auto',
        }}
      >
        <button
          onClick={() => router.push('/')}
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
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: step === 'credentials' ? '#2563eb' : '#d1d5db' }} />
          <div style={{ width: '48px', height: '4px', backgroundColor: '#d1d5db' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: step === 'preferences' ? '#2563eb' : '#d1d5db' }} />
          <div style={{ width: '48px', height: '4px', backgroundColor: '#d1d5db' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: step === 'confirmation' ? '#2563eb' : '#d1d5db' }} />
        </div>

          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600 mb-6">Let's start with the basics</p>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">At least 8 characters with uppercase, lowercase, and numbers</p>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  Next: Set Your Preferences
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </>
          )}

          {/* Step 2: Preferences */}
          {step === 'preferences' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell Us About Your Travel Style</h2>
              <p className="text-gray-600 mb-6">Select your interests so we can personalize your itineraries</p>

              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                {/* Interests */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">What are you interested in?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {INTEREST_OPTIONS.map(interest => (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: selectedInterests.includes(interest.id) ? '2px solid #2563eb' : '2px solid #e5e7eb',
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
                  <label className="block text-lg font-semibold text-gray-900 mb-3">Travel Style</label>
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
                          border: travelStyle === style.id ? '2px solid #2563eb' : '2px solid #e5e7eb',
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
                  <label className="block text-lg font-semibold text-gray-900 mb-3">Travel Pace</label>
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
                          border: pace === p.id ? '2px solid #2563eb' : '2px solid #e5e7eb',
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

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
              <p className="text-gray-600 mb-6">We sent a 6-digit code to <strong>{email}</strong></p>

              <form onSubmit={handleConfirmation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
                >
                  {loading ? 'Confirming...' : 'Verify & Start Planning'}
                </button>
              </form>
            </>
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
    </div>
  );
}
