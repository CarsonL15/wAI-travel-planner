import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DESIGN } from '../../lib/constants';
import type { TripDestination } from '../../lib/types';
import NightsControl from './NightsControl';

interface DestinationItemProps {
  destination: TripDestination;
  dateRange: { start: string; end: string };
  onUpdateNights: (id: string, nights: number) => void;
  onRemove: (id: string) => void;
}

export default function DestinationItem({
  destination,
  dateRange,
  onUpdateNights,
  onRemove,
}: DestinationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: destination.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: DESIGN.colors.bgCard,
        border: `1px solid ${DESIGN.colors.border}`,
        borderRadius: DESIGN.radius.lg,
        transition: `all ${DESIGN.transitions.fast}`,
      }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          background: 'transparent',
          border: 'none',
          cursor: 'grab',
          color: DESIGN.colors.textMuted,
          touchAction: 'none',
        }}
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      {/* Order number */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: DESIGN.gradients.primary,
          borderRadius: DESIGN.radius.full,
          color: 'white',
          fontSize: '12px',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {destination.order + 1}
      </div>

      {/* Destination info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: DESIGN.colors.textPrimary,
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {destination.name}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: DESIGN.colors.textMuted,
          }}
        >
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </div>
      </div>

      {/* Nights control */}
      <NightsControl
        nights={destination.nights}
        onChange={(nights) => onUpdateNights(destination.id, nights)}
      />

      {/* Remove button */}
      <button
        onClick={() => onRemove(destination.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          padding: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: DESIGN.radius.md,
          color: DESIGN.colors.textMuted,
          cursor: 'pointer',
          transition: `all ${DESIGN.transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
          e.currentTarget.style.color = DESIGN.colors.error;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = DESIGN.colors.textMuted;
        }}
        aria-label="Remove destination"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
