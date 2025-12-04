import { THEME } from '../lib/constants';

interface AuthPromptModalProps {
  destination: string;
  onCreateAccount: () => void;
  onSignIn: () => void;
  onCancel: () => void;
}

export default function AuthPromptModal({
  destination,
  onCreateAccount,
  onSignIn,
  onCancel,
}: AuthPromptModalProps) {
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
          maxWidth: '500px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
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
            Ready to explore {destination}?
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Sign in or create an account to start planning your perfect itinerary with AI
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={onCreateAccount}
              style={{
                padding: '1.25rem 2rem',
                background: THEME.gradient,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: `0 8px 20px rgba(102, 126, 234, 0.3)`,
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Create Account
            </button>

            <button
              onClick={onSignIn}
              style={{
                padding: '1.25rem 2rem',
                backgroundColor: 'transparent',
                color: THEME.primaryColor,
                border: `2px solid ${THEME.primaryColor}`,
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
              onClick={onCancel}
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
  );
}
