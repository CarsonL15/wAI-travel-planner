import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TripPreferencesPayload = {
  tripName?: string;
  destination?: string;
  interests: string;
  placesWanted: string;
  attractionType: string[];
  budget: string;
  people: number;
  duration: number;
  tripPace: string[];
  travelStyle: string;
  // AI-generated itinerary (optional)
  generatedItinerary?: any[];
  // Raw AI output (optional)
  aiRaw?: string;
};

type TripContextValue = {
  prefs: TripPreferencesPayload | null;
  setPrefs: (p: TripPreferencesPayload) => void;
  clearPrefs: () => void;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [prefs, setPrefsState] = useState<TripPreferencesPayload | null>(null);

  const setPrefs = (p: TripPreferencesPayload) => setPrefsState(p);
  const clearPrefs = () => setPrefsState(null);

  return (
    <TripContext.Provider value={{ prefs, setPrefs, clearPrefs }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
};
