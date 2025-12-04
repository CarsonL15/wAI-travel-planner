import { useState } from 'react';
import { signUp, confirmSignUp, signIn } from '../lib/auth';
import { INTEREST_OPTIONS, TRAVEL_STYLE_OPTIONS, PACE_OPTIONS, DESIGN } from '../lib/constants';

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

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: `1px solid ${DESIGN.colors.border}`,
    borderRadius: DESIGN.radius.md,
    fontSize: '1rem',
    color: DESIGN.colors.textPrimary,
    backgroundColor: DESIGN.colors.bgCard,
    transition: `all ${DESIGN.transitions.fast}`,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: DESIGN.colors.textSecondary,
    marginBottom: '0.5rem',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="animate-fade-in"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        className="animate-scale-in"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: DESIGN.colors.bgCard,
          borderRadius: DESIGN.radius.xl,
          padding: '2.5rem',
          maxWidth: '540px',
          width: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: DESIGN.shadows.xl,
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: DESIGN.colors.textMuted,
            padding: '0.5rem',
            lineHeight: 1,
            transition: `color ${DESIGN.transitions.fast}`,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = DESIGN.colors.textPrimary}
          onMouseLeave={(e) => e.currentTarget.style.color = DESIGN.colors.textMuted}
        >
          ×
        </button>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          {(['credentials', 'preferences', 'confirmation'] as Step[]).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: step === s ? DESIGN.colors.accent : DESIGN.colors.border,
                  transition: `background-color ${DESIGN.transitions.fast}`,
                }}
              />
              {i < 2 && (
                <div style={{ width: '40px', height: '2px', backgroundColor: DESIGN.colors.border, margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 400,
                  color: DESIGN.colors.textPrimary,
                  marginBottom: '0.5rem',
                }}
              >
                Create Account
              </h2>
              <p style={{ color: DESIGN.colors.textSecondary, fontSize: '0.9375rem' }}>
                Let's start with the basics
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  required
                  minLength={8}
                />
                <p style={{ fontSize: '0.75rem', color: DESIGN.colors.textMuted, marginTop: '0.25rem' }}>
                  At least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              {error && (
                <p style={{ color: DESIGN.colors.error, fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: DESIGN.radius.md, margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: DESIGN.gradients.primary,
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: DESIGN.radius.md,
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: `all ${DESIGN.transitions.normal}`,
                  boxShadow: DESIGN.shadows.md,
                  marginTop: '0.5rem',
                }}
              >
                Continue
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span style={{ color: DESIGN.colors.textMuted, fontSize: '0.875rem' }}>Already have an account? </span>
              <button
                onClick={() => { handleClose(); onSwitchToLogin(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: DESIGN.colors.primary,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </div>
          </>
        )}

        {/* Step 2: Preferences */}
        {step === 'preferences' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 400,
                  color: DESIGN.colors.textPrimary,
                  marginBottom: '0.5rem',
                }}
              >
                Your Travel Style
              </h2>
              <p style={{ color: DESIGN.colors.textSecondary, fontSize: '0.9375rem' }}>
                Help us personalize your itineraries
              </p>
            </div>

            <form onSubmit={handlePreferencesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Interests */}
              <div>
                <label style={{ ...labelStyle, fontSize: '0.9375rem', fontWeight: 600, color: DESIGN.colors.textPrimary }}>
                  Interests
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: DESIGN.radius.md,
                        border: `1px solid ${selectedInterests.includes(interest.id) ? DESIGN.colors.accent : DESIGN.colors.border}`,
                        backgroundColor: selectedInterests.includes(interest.id) ? 'rgba(14, 165, 233, 0.1)' : DESIGN.colors.bgCard,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: `all ${DESIGN.transitions.fast}`,
                        fontSize: '0.875rem',
                        fontWeight: selectedInterests.includes(interest.id) ? 500 : 400,
                        color: selectedInterests.includes(interest.id) ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
                      }}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Style */}
              <div>
                <label style={{ ...labelStyle, fontSize: '0.9375rem', fontWeight: 600, color: DESIGN.colors.textPrimary }}>
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
                        padding: '12px 16px',
                        borderRadius: DESIGN.radius.md,
                        border: `1px solid ${travelStyle === style.id ? DESIGN.colors.accent : DESIGN.colors.border}`,
                        backgroundColor: travelStyle === style.id ? 'rgba(14, 165, 233, 0.1)' : DESIGN.colors.bgCard,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: `all ${DESIGN.transitions.fast}`,
                      }}
                    >
                      <div style={{ fontWeight: 500, color: travelStyle === style.id ? DESIGN.colors.primary : DESIGN.colors.textPrimary, fontSize: '0.9375rem' }}>
                        {style.label}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: DESIGN.colors.textMuted, marginTop: '2px' }}>
                        {style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pace */}
              <div>
                <label style={{ ...labelStyle, fontSize: '0.9375rem', fontWeight: 600, color: DESIGN.colors.textPrimary }}>
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
                        padding: '12px 16px',
                        borderRadius: DESIGN.radius.md,
                        border: `1px solid ${pace === p.id ? DESIGN.colors.accent : DESIGN.colors.border}`,
                        backgroundColor: pace === p.id ? 'rgba(14, 165, 233, 0.1)' : DESIGN.colors.bgCard,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: `all ${DESIGN.transitions.fast}`,
                      }}
                    >
                      <div style={{ fontWeight: 500, color: pace === p.id ? DESIGN.colors.primary : DESIGN.colors.textPrimary, fontSize: '0.9375rem' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: DESIGN.colors.textMuted, marginTop: '2px' }}>
                        {p.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p style={{ color: DESIGN.colors.error, fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: DESIGN.radius.md, margin: 0 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); }}
                  style={{
                    flex: 1,
                    backgroundColor: DESIGN.colors.bgSecondary,
                    color: DESIGN.colors.textSecondary,
                    padding: '0.875rem',
                    borderRadius: DESIGN.radius.md,
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
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
                    background: DESIGN.gradients.primary,
                    color: 'white',
                    padding: '0.875rem',
                    borderRadius: DESIGN.radius.md,
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: DESIGN.shadows.md,
                  }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 400,
                  color: DESIGN.colors.textPrimary,
                  marginBottom: '0.5rem',
                }}
              >
                Verify Email
              </h2>
              <p style={{ color: DESIGN.colors.textSecondary, fontSize: '0.9375rem' }}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Verification Code</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  style={{
                    ...inputStyle,
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    letterSpacing: '0.3em',
                  }}
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <p style={{ color: DESIGN.colors.error, fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: DESIGN.radius.md, margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: DESIGN.gradients.primary,
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: DESIGN.radius.md,
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: DESIGN.shadows.md,
                  marginTop: '0.5rem',
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Start'}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
