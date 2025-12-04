import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DESIGN } from '../../lib/constants';
import type { TripDestination, GeocodingResult, TransportMode, RouteLeg } from '../../lib/types';
import DestinationItem from './DestinationItem';
import DestinationSearch from './DestinationSearch';
import TransportIndicator, { getRecommendedTransportMode } from './TransportIndicator';

interface DestinationListProps {
  destinations: TripDestination[];
  startDate: string;
  onDestinationsChange: (destinations: TripDestination[]) => void;
  routeLegs?: RouteLeg[];
  transportModes?: Record<string, TransportMode>;
  onTransportModeChange?: (fromId: string, toId: string, mode: TransportMode) => void;
}

export default function DestinationList({
  destinations,
  startDate,
  onDestinationsChange,
  routeLegs = [],
  transportModes = {},
  onTransportModeChange,
}: DestinationListProps) {

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate date ranges for each destination
  const getDateRanges = () => {
    const ranges: Array<{ start: string; end: string }> = [];
    let currentDate = new Date(startDate);

    destinations.forEach((dest) => {
      const startStr = currentDate.toISOString().split('T')[0];
      currentDate.setDate(currentDate.getDate() + dest.nights);
      const endStr = currentDate.toISOString().split('T')[0];
      ranges.push({ start: startStr, end: endStr });
    });

    return ranges;
  };

  const dateRanges = getDateRanges();

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = destinations.findIndex((d) => d.id === active.id);
      const newIndex = destinations.findIndex((d) => d.id === over.id);

      const reordered = arrayMove(destinations, oldIndex, newIndex).map(
        (dest, index) => ({
          ...dest,
          order: index,
        })
      );

      onDestinationsChange(reordered);
    }
  };

  // Update nights for a destination
  const handleUpdateNights = (id: string, nights: number) => {
    const updated = destinations.map((dest) =>
      dest.id === id ? { ...dest, nights } : dest
    );
    onDestinationsChange(updated);
  };

  // Get transport mode key for a leg between two destinations
  const getTransportKey = (fromId: string, toId: string) => `${fromId}-${toId}`;

  // Remove a destination
  const handleRemove = (id: string) => {
    const filtered = destinations
      .filter((dest) => dest.id !== id)
      .map((dest, index) => ({
        ...dest,
        order: index,
      }));
    onDestinationsChange(filtered);
  };

  // Add a new destination from search
  const handleAddDestination = (result: GeocodingResult) => {
    const newDestination: TripDestination = {
      id: `dest-${Date.now()}`,
      name: result.name,
      nights: 2, // Default nights
      order: destinations.length,
      coordinates: result.coordinates,
    };

    // If there's a previous destination, set the transport mode to the recommended one
    if (destinations.length > 0 && onTransportModeChange) {
      const prevDestination = destinations[destinations.length - 1];
      if (prevDestination.coordinates) {
        const recommendedMode = getRecommendedTransportMode(
          prevDestination.coordinates,
          result.coordinates,
          prevDestination.name,
          result.name
        );
        onTransportModeChange(prevDestination.id, newDestination.id, recommendedMode);
      }
    }

    onDestinationsChange([...destinations, newDestination]);
  };

  // Calculate total nights
  const totalNights = destinations.reduce((sum, d) => sum + d.nights, 0);

  // Get the transport mode for a specific leg, default to 'train'
  const getTransportMode = (fromId: string, toId: string): TransportMode => {
    return transportModes[getTransportKey(fromId, toId)] || 'train';
  };

  // Get route leg info for a specific leg
  const getRouteLeg = (fromId: string, toId: string): RouteLeg | undefined => {
    return routeLegs.find(leg => leg.fromId === fromId && leg.toId === toId);
  };

  // Handle transport mode change - use parent handler if available
  const handleTransportModeChangeInternal = (fromId: string, toId: string, mode: TransportMode) => {
    if (onTransportModeChange) {
      onTransportModeChange(fromId, toId, mode);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${DESIGN.colors.border}`,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 400,
            color: DESIGN.colors.textPrimary,
            margin: 0,
          }}
        >
          Your Destinations
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: DESIGN.colors.textMuted,
            margin: '4px 0 0 0',
          }}
        >
          {destinations.length === 0
            ? 'Add destinations to start planning'
            : `${destinations.length} ${destinations.length === 1 ? 'stop' : 'stops'} · ${totalNights} ${totalNights === 1 ? 'night' : 'nights'}`}
        </p>
      </div>

      {/* Destination list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {destinations.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={destinations.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {destinations.map((destination, index) => {
                  const nextDestination = destinations[index + 1];
                  const showTransport = nextDestination !== undefined;
                  const routeLeg = showTransport
                    ? getRouteLeg(destination.id, nextDestination.id)
                    : undefined;

                  return (
                    <div key={destination.id}>
                      <DestinationItem
                        destination={destination}
                        dateRange={dateRanges[index]}
                        onUpdateNights={handleUpdateNights}
                        onRemove={handleRemove}
                      />
                      {showTransport && (
                        <TransportIndicator
                          mode={getTransportMode(destination.id, nextDestination.id)}
                          fromCoordinates={destination.coordinates}
                          toCoordinates={nextDestination.coordinates}
                          fromName={destination.name}
                          toName={nextDestination.name}
                          routeLeg={routeLeg}
                          onModeChange={(mode) =>
                            handleTransportModeChangeInternal(destination.id, nextDestination.id, mode)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </SortableContext>
            </DndContext>
          )}

          {/* Spacer with dotted line before add destination */}
          {destinations.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 0',
                position: 'relative',
              }}
            >
              {/* Vertical dotted line */}
              <div
                style={{
                  position: 'absolute',
                  left: '26px',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: `repeating-linear-gradient(
                    to bottom,
                    ${DESIGN.colors.border} 0,
                    ${DESIGN.colors.border} 4px,
                    transparent 4px,
                    transparent 8px
                  )`,
                }}
              />
            </div>
          )}

          {/* Add destination card - always visible at the end */}
          <DestinationSearch
            onSelect={handleAddDestination}
            nextOrder={destinations.length + 1}
          />
        </div>
      </div>
    </div>
  );
}
