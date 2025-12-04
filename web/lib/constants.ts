// Shared constants for the wAI Travel Planner app

export const INTEREST_OPTIONS = [
  { id: 'hiking', label: '🥾 Hiking & Outdoors', category: 'activity' },
  { id: 'nightlife', label: '🎉 Nightlife & Clubbing', category: 'activity' },
  { id: 'food', label: '🍽️ Food & Dining', category: 'activity' },
  { id: 'museums', label: '🏛️ Museums & Culture', category: 'activity' },
  { id: 'beaches', label: '🏖️ Beaches & Relaxation', category: 'activity' },
  { id: 'shopping', label: '🛍️ Shopping', category: 'activity' },
  { id: 'adventure', label: '🏔️ Adventure Sports', category: 'activity' },
  { id: 'photography', label: '📸 Photography', category: 'activity' },
  { id: 'history', label: '📚 Historical Sites', category: 'activity' },
  { id: 'nature', label: '🌿 Nature & Wildlife', category: 'activity' },
] as const;

export const TRAVEL_STYLE_OPTIONS = [
  { id: 'luxury', label: '💎 Luxury', description: 'High-end hotels, fine dining' },
  { id: 'budget', label: '💰 Budget-Friendly', description: 'Hostels, local spots' },
  { id: 'balanced', label: '⚖️ Balanced', description: 'Mix of comfort and value' },
  { id: 'backpacker', label: '🎒 Backpacker', description: 'Adventurous, minimal' },
] as const;

export const PACE_OPTIONS = [
  { id: 'relaxed', label: '🌅 Relaxed', description: 'Slow pace, lots of downtime' },
  { id: 'moderate', label: '👣 Moderate', description: 'Balanced schedule' },
  { id: 'fast', label: '⚡ Fast-Paced', description: 'Pack in as much as possible' },
] as const;

export const THEME = {
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  borderColor: '#e5e7eb',
  selectedBorderColor: '#667eea',
  selectedBgColor: '#eff6ff',
} as const;

export const MAX_TRIP_DAYS = 14;

// Type exports for use in components
export type InterestOption = typeof INTEREST_OPTIONS[number];
export type TravelStyleOption = typeof TRAVEL_STYLE_OPTIONS[number];
export type PaceOption = typeof PACE_OPTIONS[number];
