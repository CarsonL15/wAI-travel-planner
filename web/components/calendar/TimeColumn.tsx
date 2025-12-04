import { DESIGN, CALENDAR } from '../../lib/constants';

interface TimeColumnProps {
  hourHeight?: number;
}

export default function TimeColumn({ hourHeight = CALENDAR.HOUR_HEIGHT }: TimeColumnProps) {
  const hours = [];
  for (let h = CALENDAR.START_HOUR; h <= CALENDAR.END_HOUR; h++) {
    hours.push(h);
  }

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div
      style={{
        width: `${CALENDAR.TIME_COLUMN_WIDTH}px`,
        flexShrink: 0,
        borderRight: `1px solid ${DESIGN.colors.border}`,
        backgroundColor: DESIGN.colors.bgSecondary,
      }}
    >
      {/* Header spacer */}
      <div
        style={{
          height: '60px',
          borderBottom: `1px solid ${DESIGN.colors.border}`,
        }}
      />

      {/* Time labels */}
      <div style={{ position: 'relative' }}>
        {hours.map((hour) => (
          <div
            key={hour}
            style={{
              height: `${hourHeight}px`,
              position: 'relative',
              borderBottom: `1px solid ${DESIGN.colors.border}`,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '8px',
                fontSize: '11px',
                color: DESIGN.colors.textMuted,
                fontWeight: 500,
              }}
            >
              {formatHour(hour)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
