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

/** Seconds for each phase of one breath, in order: inhale, hold, exhale, holdOut (hold after exhaling). */
export type PhaseDurations = { inhale: number; hold: number; exhale: number; holdOut: number };

// Allowed seconds for each phase; either hold may be 0 to skip it.
export const PHASE_LIMITS: Record<keyof PhaseDurations, { min: number; max: number }> = {
  inhale: { min: 2, max: 8 },
  hold: { min: 0, max: 6 },
  exhale: { min: 2, max: 10 },
  holdOut: { min: 0, max: 6 },
};

// One-tap starting points for the per-phase settings, in seconds.
export const PRESETS: { label: string; durations: PhaseDurations }[] = [
  { label: 'Gentle', durations: { inhale: 3, hold: 1, exhale: 4, holdOut: 0 } },
  { label: 'Slow', durations: { inhale: 4, hold: 2, exhale: 5, holdOut: 2 } },
  { label: 'Box', durations: { inhale: 4, hold: 4, exhale: 4, holdOut: 4 } },
];

export const BREATH_COUNTS = [3, 5, 8, 10];

export const SCENE_IDS = ['dandelion', 'clouds', 'bubbles', 'pinwheel', 'sailboat', 'balloon'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export const sunColors = {
  body: '#FFC93C',
  rays: '#FFB627',
  glow: '#FFF1B8',
  face: '#8A5A12',
  cheek: '#FF9A8B',
  cloud: '#FFFFFF',
  cloudShade: '#DCE6EF',
  dim: '#4A5A70',
};

export const bubbleColors = {
  wand: '#FF6FA8',
  filmA: '#FFC6E5',
  filmB: '#C9B8FF',
  filmC: '#A8EEFF',
  sheenPink: '#FF9BD2',
  sheenTeal: '#7FE3F0',
};

export const pinwheelColors = {
  // [sail, folded shade] for each of the four blades
  blades: [
    ['#FF6B6B', '#D94F4F'],
    ['#FFD93D', '#E0B820'],
    ['#4D96FF', '#3576D6'],
    ['#6BCB77', '#4FA85B'],
  ] as const,
  pin: '#B0B8C4',
  stick: '#C69C6D',
};

export const sailColors = {
  waterTop: '#6EC1E4',
  waterBottom: '#2F84B8',
  shore: '#7FB77E',
  sand: '#F4D58D',
  trunk: '#8D6E4A',
  palm: '#3E9B4F',
  hull: '#E76F51',
  mast: '#6D4C35',
  sail: '#FFFFFF',
  sailEdge: '#D9E2EA',
  stripe: '#F4A261',
  flag: '#E63946',
};

export const balloonColors = {
  outer: '#EF476F',
  middle: '#FFD166',
  inner: '#06D6A0',
  band: '#8D6E4A',
  rope: '#6D4C35',
  basket: '#A0663B',
  weave: '#7A4B28',
  flameOuter: '#FF8C42',
  flameInner: '#FFE066',
};
