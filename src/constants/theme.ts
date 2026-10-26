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

export type PaceId = 'gentle' | 'slow';

// Phase lengths in milliseconds for one breath.
export const PACES: Record<PaceId, { label: string; detail: string; inhale: number; hold: number; exhale: number }> = {
  gentle: { label: 'Gentle', detail: 'In 3 · hold 1 · out 4', inhale: 3000, hold: 1000, exhale: 4000 },
  slow: { label: 'Slow', detail: 'In 4 · hold 2 · out 5', inhale: 4000, hold: 2000, exhale: 5000 },
};

export const BREATH_COUNTS = [3, 5, 8, 10];
