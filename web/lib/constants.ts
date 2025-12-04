// Shared constants for the wAI Travel Planner app

export const INTEREST_OPTIONS = [
  { id: 'hiking', label: 'Hiking & Outdoors', category: 'activity' },
  { id: 'nightlife', label: 'Nightlife & Entertainment', category: 'activity' },
  { id: 'food', label: 'Food & Dining', category: 'activity' },
  { id: 'museums', label: 'Museums & Culture', category: 'activity' },
  { id: 'beaches', label: 'Beaches & Relaxation', category: 'activity' },
  { id: 'shopping', label: 'Shopping', category: 'activity' },
  { id: 'adventure', label: 'Adventure Sports', category: 'activity' },
  { id: 'photography', label: 'Photography', category: 'activity' },
  { id: 'history', label: 'Historical Sites', category: 'activity' },
  { id: 'nature', label: 'Nature & Wildlife', category: 'activity' },
] as const;

export const TRAVEL_STYLE_OPTIONS = [
  { id: 'luxury', label: 'Luxury', description: 'High-end hotels, fine dining' },
  { id: 'budget', label: 'Budget-Friendly', description: 'Hostels, local spots' },
  { id: 'balanced', label: 'Balanced', description: 'Mix of comfort and value' },
  { id: 'backpacker', label: 'Backpacker', description: 'Adventurous, minimal' },
] as const;

export const PACE_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed', description: 'Slow pace, lots of downtime' },
  { id: 'moderate', label: 'Moderate', description: 'Balanced schedule' },
  { id: 'fast', label: 'Fast-Paced', description: 'Pack in as much as possible' },
] as const;

// Design System Tokens
export const DESIGN = {
  colors: {
    primary: '#1E3A5F',
    primaryLight: '#2D5A8A',
    primaryDark: '#152A45',
    accent: '#0EA5E9',
    accentLight: '#38BDF8',
    highlight: '#C9A227',
    bgPrimary: '#FAFAFA',
    bgSecondary: '#F5F5F5',
    bgCard: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%)',
    accent: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    hero: 'linear-gradient(180deg, #F5F5F5 0%, #FAFAFA 100%)',
    cardHover: 'linear-gradient(180deg, rgba(30,58,95,0.02) 0%, rgba(14,165,233,0.03) 100%)',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
    glow: '0 0 20px rgba(14, 165, 233, 0.15)',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Legacy THEME export for backwards compatibility during migration
export const THEME = {
  gradient: DESIGN.gradients.primary,
  primaryColor: DESIGN.colors.primary,
  secondaryColor: DESIGN.colors.primaryLight,
  borderColor: DESIGN.colors.border,
  selectedBorderColor: DESIGN.colors.accent,
  selectedBgColor: DESIGN.colors.bgSecondary,
} as const;

export const MAX_TRIP_DAYS = 14;

// Activity category colors for calendar
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  sightseeing: { bg: '#EEF2FF', border: '#6366F1', text: '#4338CA' },
  food: { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' },
  outdoor: { bg: '#D1FAE5', border: '#10B981', text: '#059669' },
  culture: { bg: '#FCE7F3', border: '#EC4899', text: '#DB2777' },
  shopping: { bg: '#E0E7FF', border: '#8B5CF6', text: '#7C3AED' },
  relaxation: { bg: '#CFFAFE', border: '#06B6D4', text: '#0891B2' },
  nightlife: { bg: '#EDE9FE', border: '#A78BFA', text: '#7C3AED' },
  other: { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280' },
};

// Calendar constants
export const CALENDAR = {
  START_HOUR: 6,      // 6 AM
  END_HOUR: 23,       // 11 PM
  HOUR_HEIGHT: 60,    // pixels per hour
  MIN_INCREMENT: 15,  // minutes
  TIME_COLUMN_WIDTH: 60,
  MAX_DAYS_VISIBLE: 7,
} as const;

// Type exports for use in components
export type InterestOption = typeof INTEREST_OPTIONS[number];
export type TravelStyleOption = typeof TRAVEL_STYLE_OPTIONS[number];
export type PaceOption = typeof PACE_OPTIONS[number];
