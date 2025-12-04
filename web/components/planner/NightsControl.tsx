import { DESIGN } from '../../lib/constants';

interface NightsControlProps {
  nights: number;
  onChange: (nights: number) => void;
  min?: number;
  max?: number;
}

export default function NightsControl({
  nights,
  onChange,
  min = 1,
  max = 14
}: NightsControlProps) {
  const handleDecrease = () => {
    if (nights > min) {
      onChange(nights - 1);
    }
  };

  const handleIncrease = () => {
    if (nights < max) {
      onChange(nights + 1);
    }
  };

  const buttonStyle = (disabled: boolean): React.CSSProperties => ({
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${DESIGN.colors.border}`,
    borderRadius: DESIGN.radius.md,
    background: disabled ? DESIGN.colors.bgSecondary : DESIGN.colors.bgCard,
    color: disabled ? DESIGN.colors.textMuted : DESIGN.colors.textPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '16px',
    fontWeight: 500,
    transition: `all ${DESIGN.transitions.fast}`,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <button
        onClick={handleDecrease}
        disabled={nights <= min}
        style={buttonStyle(nights <= min)}
        onMouseEnter={(e) => {
          if (nights > min) {
            e.currentTarget.style.borderColor = DESIGN.colors.accent;
            e.currentTarget.style.background = DESIGN.colors.bgSecondary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = DESIGN.colors.border;
          e.currentTarget.style.background = nights <= min ? DESIGN.colors.bgSecondary : DESIGN.colors.bgCard;
        }}
        aria-label="Decrease nights"
      >
        -
      </button>

      <span
        style={{
          minWidth: '50px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 500,
          color: DESIGN.colors.textPrimary,
        }}
      >
        {nights} {nights === 1 ? 'night' : 'nights'}
      </span>

      <button
        onClick={handleIncrease}
        disabled={nights >= max}
        style={buttonStyle(nights >= max)}
        onMouseEnter={(e) => {
          if (nights < max) {
            e.currentTarget.style.borderColor = DESIGN.colors.accent;
            e.currentTarget.style.background = DESIGN.colors.bgSecondary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = DESIGN.colors.border;
          e.currentTarget.style.background = nights >= max ? DESIGN.colors.bgSecondary : DESIGN.colors.bgCard;
        }}
        aria-label="Increase nights"
      >
        +
      </button>
    </div>
  );
}
