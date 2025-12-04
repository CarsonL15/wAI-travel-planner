import { useState, useEffect, useCallback, useReducer } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { DESIGN, CALENDAR } from '../../lib/constants';
import type { CalendarDay, CalendarActivity, CalendarState, HistoryEntry, ActivityCategory, CostLevel } from '../../lib/types';
import CalendarHeader from './CalendarHeader';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';
import ActivityEditor from './ActivityEditor';
import AddActivityPanel from './AddActivityPanel';

interface CalendarEditorProps {
  tripName: string;
  initialDays: CalendarDay[];
  onSave: (days: CalendarDay[]) => void;
  onBack: () => void;
}

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function snapToGrid(minutes: number): number {
  return Math.round(minutes / CALENDAR.MIN_INCREMENT) * CALENDAR.MIN_INCREMENT;
}

// Check if two activities overlap
function activitiesOverlap(a: CalendarActivity, b: CalendarActivity): boolean {
  if (a.dayIndex !== b.dayIndex) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

// Find a non-overlapping slot for an activity
function findNonOverlappingSlot(
  activity: CalendarActivity,
  targetDayIndex: number,
  targetStartMinutes: number,
  existingActivities: CalendarActivity[]
): { startTime: string; endTime: string } | null {
  const duration = timeToMinutes(activity.endTime) - timeToMinutes(activity.startTime);
  const snappedStart = snapToGrid(targetStartMinutes);

  // Try the target position first
  const testActivity: CalendarActivity = {
    ...activity,
    dayIndex: targetDayIndex,
    startTime: minutesToTime(snappedStart),
    endTime: minutesToTime(snappedStart + duration),
  };

  const otherActivities = existingActivities.filter((a) => a.id !== activity.id && a.dayIndex === targetDayIndex);

  if (!otherActivities.some((a) => activitiesOverlap(testActivity, a))) {
    return { startTime: testActivity.startTime, endTime: testActivity.endTime };
  }

  // Try to find nearest slot (search up to 4 hours in each direction)
  const searchRange = 4 * 60; // 4 hours in minutes
  for (let offset = CALENDAR.MIN_INCREMENT; offset <= searchRange; offset += CALENDAR.MIN_INCREMENT) {
    // Try after
    const afterStart = snappedStart + offset;
    if (afterStart + duration <= CALENDAR.END_HOUR * 60) {
      const afterTest: CalendarActivity = {
        ...testActivity,
        startTime: minutesToTime(afterStart),
        endTime: minutesToTime(afterStart + duration),
      };
      if (!otherActivities.some((a) => activitiesOverlap(afterTest, a))) {
        return { startTime: afterTest.startTime, endTime: afterTest.endTime };
      }
    }

    // Try before
    const beforeStart = snappedStart - offset;
    if (beforeStart >= CALENDAR.START_HOUR * 60) {
      const beforeTest: CalendarActivity = {
        ...testActivity,
        startTime: minutesToTime(beforeStart),
        endTime: minutesToTime(beforeStart + duration),
      };
      if (!otherActivities.some((a) => activitiesOverlap(beforeTest, a))) {
        return { startTime: beforeTest.startTime, endTime: beforeTest.endTime };
      }
    }
  }

  return null; // No valid slot found
}

// State reducer
type CalendarAction =
  | { type: 'SET_DAYS'; days: CalendarDay[] }
  | { type: 'MOVE_ACTIVITY'; activityId: string; toDayIndex: number; toStartTime: string; toEndTime: string }
  | { type: 'UPDATE_ACTIVITY'; activity: CalendarActivity }
  | { type: 'DELETE_ACTIVITY'; activityId: string }
  | { type: 'ADD_ACTIVITY'; activity: CalendarActivity }
  | { type: 'SET_WEEK_START'; weekStart: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_DAYS': {
      const newEntry: HistoryEntry = { days: JSON.parse(JSON.stringify(action.days)), timestamp: Date.now() };
      return {
        ...state,
        days: action.days,
        history: [...state.history.slice(0, state.historyIndex + 1), newEntry],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'MOVE_ACTIVITY': {
      console.log('[Calendar] MOVE_ACTIVITY reducer:', {
        activityId: action.activityId,
        toDayIndex: action.toDayIndex,
        toStartTime: action.toStartTime,
        toEndTime: action.toEndTime,
      });

      const newDays = state.days.map((day, dayIndex) => {
        // Remove from old day
        const activities = day.activities.filter((a) => a.id !== action.activityId);

        // Add to new day
        if (dayIndex === action.toDayIndex) {
          const movedActivity = state.days
            .flatMap((d) => d.activities)
            .find((a) => a.id === action.activityId);

          if (movedActivity) {
            activities.push({
              ...movedActivity,
              dayIndex: action.toDayIndex,
              startTime: action.toStartTime,
              endTime: action.toEndTime,
            });
          }
        }

        return { ...day, activities };
      });

      console.log('[Calendar] MOVE_ACTIVITY new days:', newDays.map(d => ({ date: d.date, activities: d.activities.length })));

      const newEntry: HistoryEntry = { days: JSON.parse(JSON.stringify(newDays)), timestamp: Date.now() };
      return {
        ...state,
        days: newDays,
        history: [...state.history.slice(0, state.historyIndex + 1), newEntry],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'UPDATE_ACTIVITY': {
      const newDays = state.days.map((day, dayIndex) => {
        if (dayIndex !== action.activity.dayIndex) {
          return {
            ...day,
            activities: day.activities.filter((a) => a.id !== action.activity.id),
          };
        }

        const existingIndex = day.activities.findIndex((a) => a.id === action.activity.id);
        if (existingIndex >= 0) {
          const newActivities = [...day.activities];
          newActivities[existingIndex] = action.activity;
          return { ...day, activities: newActivities };
        } else {
          return { ...day, activities: [...day.activities, action.activity] };
        }
      });

      const newEntry: HistoryEntry = { days: JSON.parse(JSON.stringify(newDays)), timestamp: Date.now() };
      return {
        ...state,
        days: newDays,
        history: [...state.history.slice(0, state.historyIndex + 1), newEntry],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'DELETE_ACTIVITY': {
      console.log('[Calendar] DELETE_ACTIVITY - creating history entry');
      const newDays = state.days.map((day) => ({
        ...day,
        activities: day.activities.filter((a) => a.id !== action.activityId),
      }));

      const newEntry: HistoryEntry = { days: JSON.parse(JSON.stringify(newDays)), timestamp: Date.now() };
      const newState = {
        ...state,
        days: newDays,
        selectedActivityId: state.selectedActivityId === action.activityId ? null : state.selectedActivityId,
        history: [...state.history.slice(0, state.historyIndex + 1), newEntry],
        historyIndex: state.historyIndex + 1,
      };
      console.log('[Calendar] New history length:', newState.history.length, 'index:', newState.historyIndex);
      return newState;
    }

    case 'ADD_ACTIVITY': {
      const newDays = state.days.map((day, dayIndex) => {
        if (dayIndex !== action.activity.dayIndex) return day;
        return { ...day, activities: [...day.activities, action.activity] };
      });

      const newEntry: HistoryEntry = { days: JSON.parse(JSON.stringify(newDays)), timestamp: Date.now() };
      return {
        ...state,
        days: newDays,
        history: [...state.history.slice(0, state.historyIndex + 1), newEntry],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'SET_WEEK_START':
      return { ...state, currentWeekStart: action.weekStart };

    case 'UNDO': {
      console.log('[Calendar] UNDO - historyIndex:', state.historyIndex, 'history length:', state.history.length);
      if (state.historyIndex <= 0) {
        console.log('[Calendar] Cannot undo - already at beginning');
        return state;
      }
      const newIndex = state.historyIndex - 1;
      console.log('[Calendar] Undoing to index:', newIndex);
      return {
        ...state,
        days: JSON.parse(JSON.stringify(state.history[newIndex].days)),
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      console.log('[Calendar] REDO - historyIndex:', state.historyIndex, 'history length:', state.history.length);
      if (state.historyIndex >= state.history.length - 1) {
        console.log('[Calendar] Cannot redo - already at end');
        return state;
      }
      const newIndex = state.historyIndex + 1;
      console.log('[Calendar] Redoing to index:', newIndex);
      return {
        ...state,
        days: JSON.parse(JSON.stringify(state.history[newIndex].days)),
        historyIndex: newIndex,
      };
    }

    default:
      return state;
  }
}

export default function CalendarEditor({ tripName, initialDays, onSave, onBack }: CalendarEditorProps) {
  // Use lazy initialization for useReducer to ensure we use the latest initialDays
  const [state, dispatch] = useReducer(calendarReducer, initialDays, (days) => ({
    days,
    currentWeekStart: 0,
    selectedActivityId: null,
    draggedActivityId: null,
    history: [{ days: JSON.parse(JSON.stringify(days)), timestamp: Date.now() }],
    historyIndex: 0,
  }));
  const [editingActivity, setEditingActivity] = useState<CalendarActivity | null>(null);
  const [addPanelInfo, setAddPanelInfo] = useState<{
    dayIndex: number;
    startTime: string;
    position: { x: number; y: number };
  } | null>(null);
  const [resizing, setResizing] = useState<{ activityId: string; edge: 'top' | 'bottom'; initialY: number; initialTime: string } | null>(null);

  // Sensor for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedActivityId && !editingActivity) {
          dispatch({ type: 'DELETE_ACTIVITY', activityId: state.selectedActivityId });
        }
      }
      if (e.key === 'Escape') {
        setEditingActivity(null);
        setAddPanelInfo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedActivityId, editingActivity]);

  // Handle resize
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const activity = state.days.flatMap((d) => d.activities).find((a) => a.id === resizing.activityId);
      if (!activity) return;

      const deltaY = e.clientY - resizing.initialY;
      const deltaMinutes = Math.round((deltaY / CALENDAR.HOUR_HEIGHT) * 60);
      const initialMinutes = timeToMinutes(resizing.initialTime);
      const newMinutes = snapToGrid(initialMinutes + deltaMinutes);

      const startMinutes = timeToMinutes(activity.startTime);
      const endMinutes = timeToMinutes(activity.endTime);

      if (resizing.edge === 'top') {
        const newStart = Math.max(CALENDAR.START_HOUR * 60, Math.min(endMinutes - CALENDAR.MIN_INCREMENT, newMinutes));
        dispatch({
          type: 'UPDATE_ACTIVITY',
          activity: { ...activity, startTime: minutesToTime(newStart) },
        });
      } else {
        const newEnd = Math.min(CALENDAR.END_HOUR * 60, Math.max(startMinutes + CALENDAR.MIN_INCREMENT, newMinutes));
        dispatch({
          type: 'UPDATE_ACTIVITY',
          activity: { ...activity, endTime: minutesToTime(newEnd) },
        });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, state.days]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    const activityId = active.id as string;
    const activity = state.days.flatMap((d) => d.activities).find((a) => a.id === activityId);
    if (!activity) {
      console.log('[Calendar] Drag end: activity not found');
      return;
    }

    // Determine target day - use 'over' if available, otherwise keep same day
    let targetDayIndex = activity.dayIndex;

    if (over) {
      const targetDayId = over.id as string;
      if (targetDayId.startsWith('day-')) {
        targetDayIndex = parseInt(targetDayId.replace('day-', ''), 10);
      }
    }

    // Calculate time change based on vertical delta
    const deltaMinutes = Math.round((delta.y / CALENDAR.HOUR_HEIGHT) * 60);
    const currentStartMinutes = timeToMinutes(activity.startTime);
    const newStartMinutes = snapToGrid(currentStartMinutes + deltaMinutes);

    // Calculate duration to preserve it
    const duration = timeToMinutes(activity.endTime) - timeToMinutes(activity.startTime);

    // Clamp to valid range
    const clampedStartMinutes = Math.max(
      CALENDAR.START_HOUR * 60,
      Math.min(CALENDAR.END_HOUR * 60 - duration, newStartMinutes)
    );
    const clampedEndMinutes = clampedStartMinutes + duration;

    console.log('[Calendar] Drag end:', {
      deltaY: delta.y,
      deltaMinutes,
      from: activity.startTime,
      to: minutesToTime(clampedStartMinutes),
      fromDay: activity.dayIndex,
      targetDay: targetDayIndex,
      over: over?.id
    });

    // If no significant movement, don't update
    if (Math.abs(deltaMinutes) < CALENDAR.MIN_INCREMENT && targetDayIndex === activity.dayIndex) {
      console.log('[Calendar] No significant movement, skipping update');
      return;
    }

    // Check for collisions with other activities on the target day
    const otherActivities = state.days[targetDayIndex]?.activities.filter((a) => a.id !== activityId) || [];

    const newActivity: CalendarActivity = {
      ...activity,
      dayIndex: targetDayIndex,
      startTime: minutesToTime(clampedStartMinutes),
      endTime: minutesToTime(clampedEndMinutes),
    };

    // Check if there's an overlap
    const hasOverlap = otherActivities.some((a) => activitiesOverlap(newActivity, a));

    if (hasOverlap) {
      console.log('[Calendar] Overlap detected, finding alternative slot');
      // Find a non-overlapping slot
      const slot = findNonOverlappingSlot(
        activity,
        targetDayIndex,
        clampedStartMinutes,
        state.days.flatMap((d) => d.activities)
      );

      if (slot) {
        dispatch({
          type: 'MOVE_ACTIVITY',
          activityId,
          toDayIndex: targetDayIndex,
          toStartTime: slot.startTime,
          toEndTime: slot.endTime,
        });
      } else {
        console.log('[Calendar] No valid slot found');
      }
    } else {
      // No overlap, move to the new position
      dispatch({
        type: 'MOVE_ACTIVITY',
        activityId,
        toDayIndex: targetDayIndex,
        toStartTime: newActivity.startTime,
        toEndTime: newActivity.endTime,
      });
    }
  };

  const handleSelectActivity = useCallback((id: string | null) => {
    if (id) {
      const activity = state.days.flatMap((d) => d.activities).find((a) => a.id === id);
      if (activity) {
        setEditingActivity(activity);
      }
    }
  }, [state.days]);

  const handleDeleteActivity = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', activityId: id });
  }, []);

  const handleResizeStart = useCallback((id: string, edge: 'top' | 'bottom', initialY: number) => {
    const activity = state.days.flatMap((d) => d.activities).find((a) => a.id === id);
    if (!activity) return;

    console.log('[Calendar] Resize start:', { id, edge, initialY });
    setResizing({
      activityId: id,
      edge,
      initialY,
      initialTime: edge === 'top' ? activity.startTime : activity.endTime,
    });
  }, [state.days]);

  const handleAddActivity = useCallback((dayIndex: number, time: string) => {
    // Get click position from last mouse event
    const lastEvent = window.event as MouseEvent;
    setAddPanelInfo({
      dayIndex,
      startTime: time,
      position: { x: lastEvent?.clientX || 200, y: lastEvent?.clientY || 200 },
    });
  }, []);

  const handleCreateActivity = useCallback(
    (data: { title: string; category: ActivityCategory; durationMinutes: number }) => {
      if (!addPanelInfo) return;

      const startMinutes = timeToMinutes(addPanelInfo.startTime);
      const endMinutes = startMinutes + data.durationMinutes;

      const newActivity: CalendarActivity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dayIndex: addPanelInfo.dayIndex,
        startTime: addPanelInfo.startTime,
        endTime: minutesToTime(Math.min(endMinutes, CALENDAR.END_HOUR * 60)),
        title: data.title,
        description: '',
        category: data.category,
        location: '',
        estimatedCost: 'medium' as CostLevel,
        isCustom: true,
      };

      dispatch({ type: 'ADD_ACTIVITY', activity: newActivity });
    },
    [addPanelInfo]
  );

  const handleSaveActivity = useCallback((activity: CalendarActivity) => {
    dispatch({ type: 'UPDATE_ACTIVITY', activity });
  }, []);

  const handleRegenerateWithAI = useCallback((activity: CalendarActivity) => {
    // TODO: Implement AI regeneration
    console.log('Regenerate with AI:', activity);
  }, []);

  const handleSave = useCallback(() => {
    onSave(state.days);
  }, [state.days, onSave]);

  // Calculate visible days
  const visibleDays = state.days.slice(
    state.currentWeekStart,
    state.currentWeekStart + Math.min(CALENDAR.MAX_DAYS_VISIBLE, state.days.length)
  );

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: DESIGN.colors.bgPrimary,
      }}
    >
      <CalendarHeader
        tripName={tripName}
        totalDays={state.days.length}
        currentWeekStart={state.currentWeekStart}
        canUndo={state.historyIndex > 0}
        canRedo={state.historyIndex < state.history.length - 1}
        onPrevWeek={() =>
          dispatch({ type: 'SET_WEEK_START', weekStart: Math.max(0, state.currentWeekStart - CALENDAR.MAX_DAYS_VISIBLE) })
        }
        onNextWeek={() =>
          dispatch({
            type: 'SET_WEEK_START',
            weekStart: Math.min(state.days.length - 1, state.currentWeekStart + CALENDAR.MAX_DAYS_VISIBLE),
          })
        }
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onSave={handleSave}
        onBack={onBack}
      />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'auto',
          }}
        >
          <TimeColumn />

          {visibleDays.map((day, index) => {
            const dayIndex = state.currentWeekStart + index;
            return (
              <DayColumn
                key={day.date}
                day={day}
                dayIndex={dayIndex}
                selectedActivityId={state.selectedActivityId}
                onSelectActivity={handleSelectActivity}
                onDeleteActivity={handleDeleteActivity}
                onResizeStart={handleResizeStart}
                onAddActivity={handleAddActivity}
              />
            );
          })}
        </div>

      </DndContext>

      {editingActivity && (
        <ActivityEditor
          activity={editingActivity}
          onSave={handleSaveActivity}
          onDelete={handleDeleteActivity}
          onClose={() => setEditingActivity(null)}
          onRegenerateWithAI={handleRegenerateWithAI}
        />
      )}

      {addPanelInfo && (
        <AddActivityPanel
          dayIndex={addPanelInfo.dayIndex}
          startTime={addPanelInfo.startTime}
          destinationName={state.days[addPanelInfo.dayIndex]?.destinationName || ''}
          position={addPanelInfo.position}
          onAdd={handleCreateActivity}
          onGenerateWithAI={() => {
            // TODO: Implement AI generation
            console.log('Generate with AI for', addPanelInfo);
            setAddPanelInfo(null);
          }}
          onClose={() => setAddPanelInfo(null)}
        />
      )}
    </div>
  );
}
