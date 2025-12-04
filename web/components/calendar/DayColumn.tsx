import { useDroppable } from '@dnd-kit/core';
import { DESIGN, CALENDAR } from '../../lib/constants';
import type { CalendarActivity, CalendarDay } from '../../lib/types';
import ActivityBlock from './ActivityBlock';

interface DayColumnProps {
  day: CalendarDay;
  dayIndex: number;
  hourHeight?: number;
  selectedActivityId: string | null;
  onSelectActivity: (id: string | null) => void;
  onDeleteActivity: (id: string) => void;
  onResizeStart: (id: string, edge: 'top' | 'bottom', initialY: number) => void;
  onAddActivity: (dayIndex: number, time: string) => void;
}

// Generate grid lines
function generateGridLines(hourHeight: number): React.ReactNode[] {
  const lines = [];
  const totalHours = CALENDAR.END_HOUR - CALENDAR.START_HOUR + 1;

  for (let i = 0; i < totalHours; i++) {
    lines.push(
      <div
        key={`hour-${i}`}
        style={{
          position: 'absolute',
          top: `${i * hourHeight}px`,
          left: 0,
          right: 0,
          height: `${hourHeight}px`,
          borderBottom: `1px solid ${DESIGN.colors.border}`,
        }}
      >
        {/* 15-min lines */}
        <div
          style={{
            position: 'absolute',
            top: `${hourHeight * 0.25}px`,
            left: 0,
            right: 0,
            borderBottom: `1px dashed ${DESIGN.colors.border}`,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: `${hourHeight * 0.5}px`,
            left: 0,
            right: 0,
            borderBottom: `1px dashed ${DESIGN.colors.border}`,
            opacity: 0.7,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: `${hourHeight * 0.75}px`,
            left: 0,
            right: 0,
            borderBottom: `1px dashed ${DESIGN.colors.border}`,
            opacity: 0.5,
          }}
        />
      </div>
    );
  }
  return lines;
}

// Calculate time from Y position
function getTimeFromPosition(y: number, hourHeight: number): string {
  const minutesFromStart = (y / hourHeight) * 60;
  const totalMinutes = CALENDAR.START_HOUR * 60 + minutesFromStart;

  // Snap to 15-minute intervals
  const snappedMinutes = Math.round(totalMinutes / CALENDAR.MIN_INCREMENT) * CALENDAR.MIN_INCREMENT;

  const hours = Math.floor(snappedMinutes / 60);
  const minutes = snappedMinutes % 60;

  // Clamp to valid range
  const clampedHours = Math.max(CALENDAR.START_HOUR, Math.min(CALENDAR.END_HOUR, hours));

  return `${clampedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DayColumn({
  day,
  dayIndex,
  hourHeight = CALENDAR.HOUR_HEIGHT,
  selectedActivityId,
  onSelectActivity,
  onDeleteActivity,
  onResizeStart,
  onAddActivity,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`,
    data: { dayIndex },
  });

  const totalHours = CALENDAR.END_HOUR - CALENDAR.START_HOUR + 1;
  const gridHeight = totalHours * hourHeight;

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks on the grid itself, not on activities
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = getTimeFromPosition(y, hourHeight);

    onAddActivity(dayIndex, time);
  };

  const handleBackgroundClick = () => {
    onSelectActivity(null);
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: '150px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${DESIGN.colors.border}`,
      }}
    >
      {/* Day header */}
      <div
        style={{
          height: '60px',
          padding: '8px 12px',
          borderBottom: `1px solid ${DESIGN.colors.border}`,
          backgroundColor: DESIGN.colors.bgSecondary,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: DESIGN.colors.textPrimary,
          }}
        >
          {formatDate(day.date)}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: DESIGN.colors.accent,
            fontWeight: 500,
          }}
        >
          {day.destinationName}
        </div>
      </div>

      {/* Time grid */}
      <div
        ref={setNodeRef}
        onClick={handleBackgroundClick}
        style={{
          position: 'relative',
          height: `${gridHeight}px`,
          backgroundColor: isOver ? `${DESIGN.colors.accent}08` : DESIGN.colors.bgCard,
          transition: `background-color ${DESIGN.transitions.fast}`,
        }}
      >
        {/* Grid lines */}
        {generateGridLines(hourHeight)}

        {/* Clickable overlay for adding activities */}
        <div
          onClick={handleGridClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
          }}
        />

        {/* Activity blocks */}
        {day.activities.map((activity) => (
          <ActivityBlock
            key={activity.id}
            activity={activity}
            hourHeight={hourHeight}
            isSelected={selectedActivityId === activity.id}
            onSelect={onSelectActivity}
            onDelete={onDeleteActivity}
            onResizeStart={onResizeStart}
          />
        ))}
      </div>
    </div>
  );
}
