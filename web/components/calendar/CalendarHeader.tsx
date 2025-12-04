import { DESIGN, CALENDAR } from '../../lib/constants';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CalendarHeaderProps {
  tripName: string;
  totalDays: number;
  currentWeekStart: number;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus?: SaveStatus;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onBack: () => void;
}

export default function CalendarHeader({
  tripName,
  totalDays,
  currentWeekStart,
  canUndo,
  canRedo,
  saveStatus = 'idle',
  onPrevWeek,
  onNextWeek,
  onUndo,
  onRedo,
  onSave,
  onBack,
}: CalendarHeaderProps) {
  const totalWeeks = Math.ceil(totalDays / CALENDAR.MAX_DAYS_VISIBLE);
  const currentWeek = Math.floor(currentWeekStart / CALENDAR.MAX_DAYS_VISIBLE) + 1;
  const showNavigation = totalDays > CALENDAR.MAX_DAYS_VISIBLE;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: DESIGN.colors.bgCard,
        borderBottom: `1px solid ${DESIGN.colors.border}`,
      }}
    >
      {/* Left: Back button and trip name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.md,
            backgroundColor: 'transparent',
            color: DESIGN.colors.textSecondary,
            fontSize: '14px',
            cursor: 'pointer',
            transition: `all ${DESIGN.transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = DESIGN.colors.borderHover;
            e.currentTarget.style.backgroundColor = DESIGN.colors.bgSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = DESIGN.colors.border;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: DESIGN.colors.textPrimary,
              margin: 0,
            }}
          >
            {tripName}
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: DESIGN.colors.textMuted,
              margin: '2px 0 0 0',
            }}
          >
            {totalDays} days • Click to add, drag to move
          </p>
        </div>
      </div>

      {/* Center: Week navigation */}
      {showNavigation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onPrevWeek}
            disabled={currentWeekStart === 0}
            style={{
              padding: '8px',
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.md,
              backgroundColor: 'transparent',
              color: currentWeekStart === 0 ? DESIGN.colors.textMuted : DESIGN.colors.textSecondary,
              cursor: currentWeekStart === 0 ? 'not-allowed' : 'pointer',
              opacity: currentWeekStart === 0 ? 0.5 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: DESIGN.colors.textPrimary,
              minWidth: '100px',
              textAlign: 'center',
            }}
          >
            Week {currentWeek} of {totalWeeks}
          </span>

          <button
            onClick={onNextWeek}
            disabled={currentWeekStart + CALENDAR.MAX_DAYS_VISIBLE >= totalDays}
            style={{
              padding: '8px',
              border: `1px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radius.md,
              backgroundColor: 'transparent',
              color:
                currentWeekStart + CALENDAR.MAX_DAYS_VISIBLE >= totalDays
                  ? DESIGN.colors.textMuted
                  : DESIGN.colors.textSecondary,
              cursor:
                currentWeekStart + CALENDAR.MAX_DAYS_VISIBLE >= totalDays ? 'not-allowed' : 'pointer',
              opacity: currentWeekStart + CALENDAR.MAX_DAYS_VISIBLE >= totalDays ? 0.5 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Right: Undo/Redo and Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '8px',
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.md,
            backgroundColor: 'transparent',
            color: canUndo ? DESIGN.colors.textSecondary : DESIGN.colors.textMuted,
            cursor: canUndo ? 'pointer' : 'not-allowed',
            opacity: canUndo ? 1 : 0.5,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '8px',
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.md,
            backgroundColor: 'transparent',
            color: canRedo ? DESIGN.colors.textSecondary : DESIGN.colors.textMuted,
            cursor: canRedo ? 'pointer' : 'not-allowed',
            opacity: canRedo ? 1 : 0.5,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
          </svg>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: DESIGN.colors.border, margin: '0 8px' }} />

        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: DESIGN.radius.md,
            background: saveStatus === 'saved'
              ? DESIGN.colors.success
              : saveStatus === 'error'
                ? DESIGN.colors.error
                : DESIGN.gradients.primary,
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: saveStatus === 'saving' ? 0.8 : 1,
            transition: `all ${DESIGN.transitions.fast}`,
          }}
        >
          {saveStatus === 'saving' ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Saving...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Error
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <path d="M17 21v-8H7v8M7 3v5h8" />
              </svg>
              Save Itinerary
            </>
          )}
        </button>
      </div>
    </header>
  );
}
