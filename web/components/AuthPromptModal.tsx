import { DESIGN } from '../lib/constants';

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
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
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
          maxWidth: '440px',
          width: '90vw',
          boxShadow: DESIGN.shadows.xl,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.5rem',
              borderRadius: DESIGN.radius.full,
              background: DESIGN.colors.bgSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={DESIGN.colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Header */}
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 400,
              color: DESIGN.colors.textPrimary,
              marginBottom: '0.75rem',
            }}
          >
            Ready to explore {destination}?
          </h2>
          <p
            style={{
              color: DESIGN.colors.textSecondary,
              marginBottom: '2rem',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}
          >
            Sign in or create an account to start planning your perfect itinerary with AI
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={onCreateAccount}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: DESIGN.gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: DESIGN.radius.md,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.normal}`,
                boxShadow: DESIGN.shadows.md,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = DESIGN.shadows.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = DESIGN.shadows.md;
              }}
            >
              Create Account
            </button>

            <button
              onClick={onSignIn}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                backgroundColor: 'transparent',
                color: DESIGN.colors.primary,
                border: `1px solid ${DESIGN.colors.primary}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = DESIGN.colors.bgSecondary;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Sign In
            </button>

            <button
              onClick={onCancel}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: DESIGN.colors.textMuted,
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: `color ${DESIGN.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = DESIGN.colors.textSecondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = DESIGN.colors.textMuted;
              }}
            >
              Choose a different destination
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
