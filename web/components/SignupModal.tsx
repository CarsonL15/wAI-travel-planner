import { useState } from 'react';
import { signUp, confirmSignUp, signIn } from '../lib/auth';
import { INTEREST_OPTIONS, TRAVEL_STYLE_OPTIONS, PACE_OPTIONS, THEME } from '../lib/constants';

interface SignupModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

type Step = 'credentials' | 'preferences' | 'confirmation';

export default function SignupModal({ onClose, onSwitchToLogin, onSuccess }: SignupModalProps) {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState('');
  const [pace, setPace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setStep('credentials');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmationCode('');
    setSelectedInterests([]);
    setTravelStyle('');
    setPace('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
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
      setStep('confirmation');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Confirmation failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          position: 'relative',
        }}
      >
        <button
          onClick={handleClose}
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
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: step === 'credentials' ? THEME.primaryColor : '#d1d5db' }} />
          <div style={{ width: '48px', height: '4px', backgroundColor: '#d1d5db' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: step === 'preferences' ? THEME.primaryColor : '#d1d5db' }} />
          <div style={{ width: '48px', height: '4px', backgroundColor: '#d1d5db' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: step === 'confirmation' ? THEME.primaryColor : '#d1d5db' }} />
        </div>

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '700' }}>
                Create Your Account
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                Let's start with the basics
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  background: THEME.gradient,
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
                  handleClose();
                  onSwitchToLogin();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: THEME.primaryColor,
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
        {step === 'preferences' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '700' }}>
                Tell Us About Your Travel Style
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                Select your interests so we can personalize your itineraries
              </p>
            </div>

            <form onSubmit={handlePreferencesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                        border: selectedInterests.includes(interest.id) ? `2px solid ${THEME.selectedBorderColor}` : `2px solid ${THEME.borderColor}`,
                        backgroundColor: selectedInterests.includes(interest.id) ? THEME.selectedBgColor : 'white',
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
                        border: travelStyle === style.id ? `2px solid ${THEME.selectedBorderColor}` : `2px solid ${THEME.borderColor}`,
                        backgroundColor: travelStyle === style.id ? THEME.selectedBgColor : 'white',
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
                        border: pace === p.id ? `2px solid ${THEME.selectedBorderColor}` : `2px solid ${THEME.borderColor}`,
                        backgroundColor: pace === p.id ? THEME.selectedBgColor : 'white',
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
                    setStep('credentials');
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
                    background: THEME.gradient,
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
        {step === 'confirmation' && (
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
                  background: THEME.gradient,
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
  );
}
