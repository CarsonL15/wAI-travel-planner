import { useState, useEffect } from 'react';
import { DESIGN, CATEGORY_COLORS } from '../../lib/constants';
import type { CalendarActivity, ActivityCategory, CostLevel } from '../../lib/types';

interface ActivityEditorProps {
  activity: CalendarActivity;
  isRegenerating?: boolean;
  onSave: (activity: CalendarActivity) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onRegenerateWithAI: (activity: CalendarActivity) => void;
}

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
  { value: 'food', label: 'Food & Dining', icon: '🍽️' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌲' },
  { value: 'culture', label: 'Culture', icon: '🎭' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'other', label: 'Other', icon: '📍' },
];

const COST_LEVELS: { value: CostLevel; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'low', label: 'Low ($)' },
  { value: 'medium', label: 'Medium ($$)' },
  { value: 'high', label: 'High ($$$)' },
];

export default function ActivityEditor({
  activity,
  isRegenerating = false,
  onSave,
  onDelete,
  onClose,
  onRegenerateWithAI,
}: ActivityEditorProps) {
  const [editedActivity, setEditedActivity] = useState<CalendarActivity>(activity);

  useEffect(() => {
    setEditedActivity(activity);
  }, [activity]);

  const handleChange = (field: keyof CalendarActivity, value: string | boolean) => {
    setEditedActivity((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editedActivity);
    onClose();
  };

  const handleDelete = () => {
    onDelete(activity.id);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: DESIGN.colors.bgCard,
          borderRadius: DESIGN.radius.xl,
          boxShadow: DESIGN.shadows.xl,
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${DESIGN.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: DESIGN.colors.textPrimary }}>
            Edit Activity
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '4px',
              cursor: 'pointer',
              color: DESIGN.colors.textMuted,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
              Title
            </label>
            <input
              type="text"
              value={editedActivity.title}
              onChange={(e) => handleChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '14px',
                color: DESIGN.colors.textPrimary,
                outline: 'none',
              }}
              placeholder="Activity title"
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={editedActivity.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '14px',
                color: DESIGN.colors.textPrimary,
                outline: 'none',
                resize: 'vertical',
              }}
              placeholder="What will you do?"
            />
          </div>

          {/* Time */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
                Start Time
              </label>
              <input
                type="time"
                value={editedActivity.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.md,
                  fontSize: '14px',
                  color: DESIGN.colors.textPrimary,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
                End Time
              </label>
              <input
                type="time"
                value={editedActivity.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.md,
                  fontSize: '14px',
                  color: DESIGN.colors.textPrimary,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
              Category
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => {
                const isSelected = editedActivity.category === cat.value;
                const colors = CATEGORY_COLORS[cat.value];
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleChange('category', cat.value)}
                    style={{
                      padding: '6px 12px',
                      border: `2px solid ${isSelected ? colors.border : DESIGN.colors.border}`,
                      borderRadius: DESIGN.radius.full,
                      backgroundColor: isSelected ? colors.bg : 'transparent',
                      color: isSelected ? colors.text : DESIGN.colors.textSecondary,
                      fontSize: '13px',
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

          {/* Location */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
              Location
            </label>
            <input
              type="text"
              value={editedActivity.location}
              onChange={(e) => handleChange('location', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '14px',
                color: DESIGN.colors.textPrimary,
                outline: 'none',
              }}
              placeholder="Where is this?"
            />
          </div>

          {/* Cost Level */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DESIGN.colors.textSecondary, marginBottom: '6px' }}>
              Estimated Cost
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COST_LEVELS.map((cost) => (
                <button
                  key={cost.value}
                  onClick={() => handleChange('estimatedCost', cost.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `2px solid ${editedActivity.estimatedCost === cost.value ? DESIGN.colors.accent : DESIGN.colors.border}`,
                    borderRadius: DESIGN.radius.md,
                    backgroundColor: editedActivity.estimatedCost === cost.value ? `${DESIGN.colors.accent}10` : 'transparent',
                    color: editedActivity.estimatedCost === cost.value ? DESIGN.colors.accent : DESIGN.colors.textSecondary,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {cost.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Regenerate button */}
          <button
            onClick={() => onRegenerateWithAI(editedActivity)}
            disabled={isRegenerating}
            style={{
              padding: '10px 16px',
              border: `1px solid ${DESIGN.colors.accent}`,
              borderRadius: DESIGN.radius.md,
              backgroundColor: isRegenerating ? `${DESIGN.colors.accent}10` : 'transparent',
              color: DESIGN.colors.accent,
              fontSize: '14px',
              fontWeight: 500,
              cursor: isRegenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isRegenerating ? 0.7 : 1,
            }}
          >
            {isRegenerating ? (
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
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                Regenerate with AI
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${DESIGN.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: DESIGN.radius.md,
              backgroundColor: `${DESIGN.colors.error}10`,
              color: DESIGN.colors.error,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                border: `1px solid ${DESIGN.colors.border}`,
                borderRadius: DESIGN.radius.md,
                backgroundColor: 'transparent',
                color: DESIGN.colors.textSecondary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: DESIGN.radius.md,
                background: DESIGN.gradients.primary,
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
