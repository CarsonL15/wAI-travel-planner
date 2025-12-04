import { useState } from 'react';
import { signIn } from '../lib/auth';
import { DESIGN } from '../lib/constants';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ onClose, onSwitchToSignup, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setEmail('');
    setPassword('');
    onClose();
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
          maxWidth: '420px',
          width: '90vw',
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
          onMouseEnter={(e) => {
            e.currentTarget.style.color = DESIGN.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = DESIGN.colors.textMuted;
          }}
        >
          ×
        </button>

        {/* Header */}
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
            Welcome Back
          </h2>
          <p style={{ color: DESIGN.colors.textSecondary, fontSize: '0.9375rem' }}>
            Sign in to continue planning
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: DESIGN.colors.textSecondary,
                marginBottom: '0.5rem',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '1rem',
                color: DESIGN.colors.textPrimary,
                backgroundColor: DESIGN.colors.bgCard,
                transition: `all ${DESIGN.transitions.fast}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DESIGN.colors.accent;
                e.currentTarget.style.boxShadow = DESIGN.shadows.glow;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DESIGN.colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: DESIGN.colors.textSecondary,
                marginBottom: '0.5rem',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '1rem',
                color: DESIGN.colors.textPrimary,
                backgroundColor: DESIGN.colors.bgCard,
                transition: `all ${DESIGN.transitions.fast}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DESIGN.colors.accent;
                e.currentTarget.style.boxShadow = DESIGN.shadows.glow;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DESIGN.colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p
              style={{
                color: DESIGN.colors.error,
                fontSize: '0.875rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderRadius: DESIGN.radius.md,
                margin: 0,
              }}
            >
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
              transition: `all ${DESIGN.transitions.normal}`,
              boxShadow: DESIGN.shadows.md,
              marginTop: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = DESIGN.shadows.lg;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = DESIGN.shadows.md;
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <span style={{ color: DESIGN.colors.textMuted, fontSize: '0.875rem' }}>
            Don't have an account?{' '}
          </span>
          <button
            onClick={() => {
              onClose();
              onSwitchToSignup();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: DESIGN.colors.primary,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: `color ${DESIGN.transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = DESIGN.colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = DESIGN.colors.primary;
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
}
