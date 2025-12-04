import { useState, useRef, useEffect } from 'react';
import { DESIGN, CATEGORY_COLORS } from '../../lib/constants';
import type { ActivityCategory } from '../../lib/types';

interface AddActivityPanelProps {
  dayIndex: number;
  startTime: string;
  destinationName: string;
  position: { x: number; y: number };
  isGenerating?: boolean;
  onAdd: (activity: {
    title: string;
    category: ActivityCategory;
    durationMinutes: number;
  }) => void;
  onGenerateWithAI: (category: ActivityCategory, durationMinutes: number) => void;
  onClose: () => void;
}

const QUICK_CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
  { value: 'food', label: 'Food', icon: '🍽️' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌲' },
  { value: 'culture', label: 'Culture', icon: '🎭' },
  { value: 'other', label: 'Other', icon: '📍' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function AddActivityPanel({
  dayIndex,
  startTime,
  destinationName,
  position,
  isGenerating = false,
  onAdd,
  onGenerateWithAI,
  onClose,
}: AddActivityPanelProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('sightseeing');
  const [duration, setDuration] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      category,
      durationMinutes: duration,
    });
    onClose();
  };

  // Calculate panel position (ensure it's visible on screen)
  const panelHeight = 380; // Approximate height of the panel
  const panelWidth = 320;
  const padding = 16;

  // Adjust position if panel would go off-screen
  let adjustedTop = position.y;
  let adjustedLeft = position.x;

  // Check if panel would go below viewport
  if (typeof window !== 'undefined') {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // If panel would extend below viewport, position it above the click point
    if (position.y + panelHeight > viewportHeight - padding) {
      adjustedTop = Math.max(padding, viewportHeight - panelHeight - padding);
    }

    // If panel would extend beyond right edge, shift it left
    if (position.x + panelWidth > viewportWidth - padding) {
      adjustedLeft = Math.max(padding, viewportWidth - panelWidth - padding);
    }
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: adjustedTop,
    left: adjustedLeft,
    zIndex: 1000,
    backgroundColor: DESIGN.colors.bgCard,
    borderRadius: DESIGN.radius.lg,
    boxShadow: DESIGN.shadows.xl,
    width: `${panelWidth}px`,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: DESIGN.colors.bgSecondary,
          borderBottom: `1px solid ${DESIGN.colors.border}`,
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, color: DESIGN.colors.textPrimary }}>
          Add Activity
        </div>
        <div style={{ fontSize: '12px', color: DESIGN.colors.textMuted, marginTop: '2px' }}>
          {formatTime(startTime)} in {destinationName}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
        {/* Title input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you doing?"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.md,
            fontSize: '14px',
            color: DESIGN.colors.textPrimary,
            outline: 'none',
            marginBottom: '12px',
          }}
        />

        {/* Category */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: DESIGN.colors.textMuted, marginBottom: '6px' }}>
            Category
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUICK_CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              const colors = CATEGORY_COLORS[cat.value];
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  style={{
                    padding: '4px 10px',
                    border: `1px solid ${isSelected ? colors.border : DESIGN.colors.border}`,
                    borderRadius: DESIGN.radius.full,
                    backgroundColor: isSelected ? colors.bg : 'transparent',
                    color: isSelected ? colors.text : DESIGN.colors.textSecondary,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: DESIGN.colors.textMuted, marginBottom: '6px' }}>
            Duration
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                style={{
                  padding: '4px 10px',
                  border: `1px solid ${duration === opt.value ? DESIGN.colors.accent : DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.full,
                  backgroundColor: duration === opt.value ? `${DESIGN.colors.accent}15` : 'transparent',
                  color: duration === opt.value ? DESIGN.colors.accent : DESIGN.colors.textSecondary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={!title.trim()}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: DESIGN.radius.md,
              background: title.trim() ? DESIGN.gradients.primary : DESIGN.colors.bgSecondary,
              color: title.trim() ? 'white' : DESIGN.colors.textMuted,
              fontSize: '14px',
              fontWeight: 500,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add Activity
          </button>
          <button
            type="button"
            onClick={() => onGenerateWithAI(category, duration)}
            disabled={isGenerating}
            style={{
              padding: '10px 16px',
              border: `1px solid ${DESIGN.colors.accent}`,
              borderRadius: DESIGN.radius.md,
              backgroundColor: isGenerating ? `${DESIGN.colors.accent}10` : 'transparent',
              color: DESIGN.colors.accent,
              fontSize: '14px',
              fontWeight: 500,
              cursor: isGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                ...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                AI
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
