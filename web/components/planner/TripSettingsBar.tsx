import { useState } from 'react';
import { DESIGN } from '../../lib/constants';
import type { BudgetLevel, PaceLevel } from '../../lib/types';

interface TripSettingsBarProps {
  startDate: string;
  budget: BudgetLevel;
  travelers: number;
  pace: PaceLevel;
  totalNights: number;
  destinationCount: number;
  onStartDateChange: (date: string) => void;
  onBudgetChange: (budget: BudgetLevel) => void;
  onTravelersChange: (count: number) => void;
  onPaceChange: (pace: PaceLevel) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
}

const BUDGET_OPTIONS: Array<{ value: BudgetLevel; label: string; icon: string }> = [
  { value: 'budget', label: 'Budget', icon: '$' },
  { value: 'moderate', label: 'Moderate', icon: '$$' },
  { value: 'comfortable', label: 'Comfortable', icon: '$$$' },
  { value: 'luxury', label: 'Luxury', icon: '$$$$' },
];

const PACE_OPTIONS: Array<{ value: PaceLevel; label: string; description: string }> = [
  { value: 'relaxed', label: 'Relaxed', description: '2-3 activities per day' },
  { value: 'moderate', label: 'Moderate', description: '3-4 activities per day' },
  { value: 'packed', label: 'Packed', description: '5+ activities per day' },
];

export default function TripSettingsBar({
  startDate,
  budget,
  travelers,
  pace,
  totalNights,
  destinationCount,
  onStartDateChange,
  onBudgetChange,
  onTravelersChange,
  onPaceChange,
  onGenerate,
  canGenerate,
  isGenerating,
}: TripSettingsBarProps) {
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showPaceDropdown, setShowPaceDropdown] = useState(false);

  // Calculate end date
  const getEndDate = () => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + totalNights);
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStartDateFormatted = () => {
    return new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 24px',
        backgroundColor: DESIGN.colors.bgCard,
        borderBottom: `1px solid ${DESIGN.colors.border}`,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Start Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: DESIGN.colors.textSecondary,
          }}
        >
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          min={today}
          onChange={(e) => onStartDateChange(e.target.value)}
          style={{
            padding: '8px 12px',
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.md,
            fontSize: '14px',
            color: DESIGN.colors.textPrimary,
            backgroundColor: DESIGN.colors.bgCard,
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: DESIGN.colors.border,
        }}
      />

      {/* Budget */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: DESIGN.colors.textSecondary,
            }}
          >
            Budget
          </label>
          <button
            onClick={() => setShowBudgetDropdown(!showBudgetDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.md,
              fontSize: '14px',
              color: DESIGN.colors.textPrimary,
              backgroundColor: DESIGN.colors.bgCard,
              cursor: 'pointer',
              transition: `all ${DESIGN.transitions.fast}`,
            }}
          >
            {BUDGET_OPTIONS.find((o) => o.value === budget)?.label}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: showBudgetDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${DESIGN.transitions.fast}`,
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Budget dropdown - opens downward */}
        {showBudgetDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              backgroundColor: DESIGN.colors.bgCard,
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.lg,
              boxShadow: DESIGN.shadows.lg,
              zIndex: 1000,
              minWidth: '160px',
              overflow: 'hidden',
            }}
          >
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onBudgetChange(option.value);
                  setShowBudgetDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  background: budget === option.value ? DESIGN.colors.bgSecondary : 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: DESIGN.colors.textPrimary,
                  transition: `background ${DESIGN.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = DESIGN.colors.bgSecondary;
                }}
                onMouseLeave={(e) => {
                  if (budget !== option.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{option.label}</span>
                <span style={{ color: DESIGN.colors.textMuted, fontSize: '12px' }}>
                  {option.icon}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: DESIGN.colors.border,
        }}
      />

      {/* Travelers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: DESIGN.colors.textSecondary,
          }}
        >
          Travelers
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3, 4].map((count) => (
            <button
              key={count}
              onClick={() => onTravelersChange(count)}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${travelers === count ? DESIGN.colors.accent : DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '14px',
                fontWeight: 500,
                color: travelers === count ? DESIGN.colors.accent : DESIGN.colors.textPrimary,
                backgroundColor: travelers === count ? 'rgba(14, 165, 233, 0.1)' : DESIGN.colors.bgCard,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.fast}`,
              }}
            >
              {count === 4 ? '4+' : count}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: DESIGN.colors.border,
        }}
      />

      {/* Pace */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: DESIGN.colors.textSecondary,
            }}
          >
            Pace
          </label>
          <button
            onClick={() => setShowPaceDropdown(!showPaceDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.md,
              fontSize: '14px',
              color: DESIGN.colors.textPrimary,
              backgroundColor: DESIGN.colors.bgCard,
              cursor: 'pointer',
              transition: `all ${DESIGN.transitions.fast}`,
            }}
          >
            {PACE_OPTIONS.find((o) => o.value === pace)?.label}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: showPaceDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${DESIGN.transitions.fast}`,
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Pace dropdown - opens downward */}
        {showPaceDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              backgroundColor: DESIGN.colors.bgCard,
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.lg,
              boxShadow: DESIGN.shadows.lg,
              zIndex: 1000,
              minWidth: '200px',
              overflow: 'hidden',
            }}
          >
            {PACE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onPaceChange(option.value);
                  setShowPaceDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  border: 'none',
                  background: pace === option.value ? DESIGN.colors.bgSecondary : 'transparent',
                  cursor: 'pointer',
                  transition: `background ${DESIGN.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = DESIGN.colors.bgSecondary;
                }}
                onMouseLeave={(e) => {
                  if (pace !== option.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary, fontWeight: 500 }}>
                  {option.label}
                </span>
                <span style={{ fontSize: '12px', color: DESIGN.colors.textMuted }}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Trip Summary */}
      {destinationCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 16px',
            backgroundColor: DESIGN.colors.bgSecondary,
            borderRadius: DESIGN.radius.lg,
            marginRight: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={DESIGN.colors.textMuted}
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
              <strong style={{ color: DESIGN.colors.textPrimary }}>{destinationCount}</strong> {destinationCount === 1 ? 'stop' : 'stops'}
            </span>
          </div>
          <div
            style={{
              width: '1px',
              height: '16px',
              backgroundColor: DESIGN.colors.border,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={DESIGN.colors.textMuted}
              strokeWidth="2"
            >
              <path d="M21 7.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h3.5" />
              <path d="M16 2v4M8 2v4M3 10h5" />
              <circle cx="18" cy="18" r="4" />
              <path d="M18 16.5v1.5l1 1" />
            </svg>
            <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
              <strong style={{ color: DESIGN.colors.textPrimary }}>{totalNights}</strong> {totalNights === 1 ? 'night' : 'nights'}
            </span>
          </div>
          <div
            style={{
              width: '1px',
              height: '16px',
              backgroundColor: DESIGN.colors.border,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={DESIGN.colors.textMuted}
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
              {getStartDateFormatted()} - {getEndDate()}
            </span>
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: canGenerate && !isGenerating ? DESIGN.gradients.primary : DESIGN.colors.bgSecondary,
          color: canGenerate && !isGenerating ? 'white' : DESIGN.colors.textMuted,
          border: 'none',
          borderRadius: DESIGN.radius.md,
          fontSize: '14px',
          fontWeight: 600,
          cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
          transition: `all ${DESIGN.transitions.normal}`,
          boxShadow: canGenerate && !isGenerating ? DESIGN.shadows.md : 'none',
        }}
        onMouseEnter={(e) => {
          if (canGenerate && !isGenerating) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = DESIGN.shadows.lg;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = canGenerate && !isGenerating ? DESIGN.shadows.md : 'none';
        }}
      >
        {isGenerating ? (
          <>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Generating...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Generate Itinerary
          </>
        )}
      </button>
    </div>
  );
}
