export const colors = {
  skyTop: '#6FBDEB',
  skyBottom: '#D4EEFB',
  hill: '#8CCB7A',
  hillShade: '#76B865',
  stem: '#4F8F45',
  core: '#B39E6E',
  seedStalk: '#EEF3F7',
  seedTuft: '#FFFFFF',
  ink: '#22324D',
  inkSoft: '#4A5B78',
  button: '#2F7D4F',
  buttonText: '#FFFFFF',
  card: 'rgba(255,255,255,0.96)',
  dotEmpty: 'rgba(255,255,255,0.55)',
  dotFull: '#FFFFFF',
};

export type PhaseDurations = { inhale: number; hold: number; exhale: number };

// Allowed seconds for each phase; hold may be 0 to skip it.
export const PHASE_LIMITS: Record<keyof PhaseDurations, { min: number; max: number }> = {
  inhale: { min: 2, max: 8 },
  hold: { min: 0, max: 6 },
  exhale: { min: 2, max: 10 },
};

// One-tap starting points for the per-phase settings, in seconds.
export const PRESETS: { label: string; durations: PhaseDurations }[] = [
  { label: 'Gentle', durations: { inhale: 3, hold: 1, exhale: 4 } },
  { label: 'Slow', durations: { inhale: 4, hold: 2, exhale: 5 } },
];

export const BREATH_COUNTS = [3, 5, 8, 10];
