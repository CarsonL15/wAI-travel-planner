import { useState } from 'react';
import { signIn } from '../lib/auth';
import { THEME } from '../lib/constants';

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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => {
              onClose();
              onSwitchToSignup();
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
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
