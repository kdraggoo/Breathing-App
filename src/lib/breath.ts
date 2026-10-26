export type Phase = 'inhale' | 'hold' | 'exhale';

export const PHASES: Phase[] = ['inhale', 'hold', 'exhale'];

/** Fractions of one breath where the inhale ends and the exhale starts. */
export function breathTiming(pace: { inhale: number; hold: number; exhale: number }) {
  const total = pace.inhale + pace.hold + pace.exhale;
  return { total, inhaleEnd: pace.inhale / total, exhaleStart: (pace.inhale + pace.hold) / total };
}

/**
 * A monotonically increasing step number for the phase at `elapsed`
 * (breath * 3 + phase index), so a reaction can tell when a new phase begins.
 */
export function phaseStep(elapsed: number, inhaleEnd: number, exhaleStart: number) {
  'worklet';
  const breath = Math.floor(elapsed);
  const c = elapsed - breath;
  return breath * 3 + (c < inhaleEnd ? 0 : c < exhaleStart ? 1 : 2);
}

/** How full the lungs are (0..1) at `elapsed`, eased for a natural rise and fall. */
export function breathAmount(elapsed: number, inhaleEnd: number, exhaleStart: number) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
  if (c < inhaleEnd) return ease(c / inhaleEnd);
  if (c < exhaleStart) return 1;
  return 1 - ease((c - exhaleStart) / (1 - exhaleStart));
}
