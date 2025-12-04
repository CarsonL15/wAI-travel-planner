import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { DESIGN, CALENDAR, CATEGORY_COLORS } from '../../lib/constants';
import type { CalendarActivity } from '../../lib/types';

interface ActivityBlockProps {
  activity: CalendarActivity;
  hourHeight?: number;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onResizeStart: (id: string, edge: 'top' | 'bottom', initialY: number) => void;
}

// Convert time string to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calculate position and height based on time
function getPosition(
  startTime: string,
  endTime: string,
  hourHeight: number
): { top: number; height: number } {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const startOffset = startMinutes - CALENDAR.START_HOUR * 60;
  const duration = endMinutes - startMinutes;

  return {
    top: (startOffset / 60) * hourHeight,
    height: Math.max((duration / 60) * hourHeight, 30), // Minimum 30px height for usability
  };
}

// Format time range for display
function formatTimeRange(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return minutes === 0 ? `${displayHours}${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

// Get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    sightseeing: '🏛️',
    food: '🍽️',
    outdoor: '🌲',
    culture: '🎭',
    shopping: '🛍️',
    relaxation: '🧘',
    nightlife: '🌙',
    other: '📍',
  };
  return icons[category] || icons.other;
}

const RESIZE_HANDLE_HEIGHT = 8;

export default function ActivityBlock({
  activity,
  hourHeight = CALENDAR.HOUR_HEIGHT,
  isSelected,
  isDragging = false,
  onSelect,
  onDelete,
  onResizeStart,
}: ActivityBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingDnd } = useDraggable({
    id: activity.id,
    data: { activity },
  });

  // Track if we just finished resizing to prevent click from firing
  const isResizingRef = useRef(false);
  // Track if we're currently dragging to prevent click
  const isDraggingRef = useRef(false);

  const { top, height } = getPosition(activity.startTime, activity.endTime, hourHeight);
  const colors = CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.other;

  // Apply transform to the whole container when dragging
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${top}px`,
    left: '4px',
    right: '4px',
    height: `${height}px`,
    backgroundColor: colors.bg,
    borderLeft: `3px solid ${colors.border}`,
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
    boxShadow: isSelected ? `0 0 0 2px ${DESIGN.colors.accent}` : DESIGN.shadows.sm,
    transition: isDraggingDnd ? 'none' : `box-shadow ${DESIGN.transitions.fast}`,
    zIndex: isDraggingDnd ? 100 : isSelected ? 10 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDraggingDnd ? 0.9 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't open editor if we just finished resizing or dragging
    if (isResizingRef.current || isDraggingRef.current) {
      isResizingRef.current = false;
      isDraggingRef.current = false;
      return;
    }
    onSelect(activity.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(activity.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, edge: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;

    // Reset the flag after mouse up
    const handleMouseUp = () => {
      // Use setTimeout to ensure click event is blocked first
      setTimeout(() => {
        isResizingRef.current = false;
      }, 100);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mouseup', handleMouseUp);

    onResizeStart(activity.id, edge, e.clientY);
  };

  const handleDragMouseDown = () => {
    isDraggingRef.current = true;

    const handleMouseUp = () => {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={setNodeRef} style={containerStyle} onClick={handleClick}>
      {/* Top resize handle - NOT part of drag zone */}
      <div
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${RESIZE_HANDLE_HEIGHT}px`,
          cursor: 'ns-resize',
          backgroundColor: isSelected ? `${colors.border}40` : 'transparent',
          zIndex: 20,
        }}
        title="Drag to change start time"
      />

      {/* Main draggable content area - this is the drag handle */}
      <div
        {...attributes}
        {...listeners}
        onMouseDown={handleDragMouseDown}
        style={{
          position: 'absolute',
          top: `${RESIZE_HANDLE_HEIGHT}px`,
          left: 0,
          right: 0,
          bottom: `${RESIZE_HANDLE_HEIGHT}px`,
          padding: '2px 8px',
          cursor: 'grab',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '2px',
          }}
        >
          <span style={{ fontSize: '12px', pointerEvents: 'none' }}>{getCategoryIcon(activity.category)}</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              pointerEvents: 'none',
            }}
          >
            {activity.title}
          </span>
        </div>

        {height > 45 && (
          <span
            style={{
              fontSize: '10px',
              color: DESIGN.colors.textMuted,
              pointerEvents: 'none',
            }}
          >
            {formatTimeRange(activity.startTime, activity.endTime)}
          </span>
        )}

        {height > 70 && activity.location && (
          <span
            style={{
              fontSize: '10px',
              color: DESIGN.colors.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: '2px',
              pointerEvents: 'none',
            }}
          >
            📍 {activity.location}
          </span>
        )}
      </div>

      {/* Delete button (shows on select) */}
      {isSelected && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: `${RESIZE_HANDLE_HEIGHT + 2}px`,
            right: '4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: DESIGN.colors.error,
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
          }}
        >
          ×
        </button>
      )}

      {/* Bottom resize handle - NOT part of drag zone */}
      <div
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${RESIZE_HANDLE_HEIGHT}px`,
          cursor: 'ns-resize',
          backgroundColor: isSelected ? `${colors.border}40` : 'transparent',
          zIndex: 20,
        }}
        title="Drag to change end time"
      />
    </div>
  );
}
