export type Phase = 'inhale' | 'hold' | 'exhale' | 'holdOut';

export const PHASES: Phase[] = ['inhale', 'hold', 'exhale', 'holdOut'];

/** Fractions of one breath where the inhale ends, the exhale starts, and the exhale ends. */
export function breathTiming(durations: Record<Phase, number>) {
  const total = durations.inhale + durations.hold + durations.exhale + durations.holdOut;
  return {
    total,
    inhaleEnd: durations.inhale / total,
    exhaleStart: (durations.inhale + durations.hold) / total,
    exhaleEnd: (durations.inhale + durations.hold + durations.exhale) / total,
  };
}

export type BreathTiming = Omit<ReturnType<typeof breathTiming>, 'total'>;

/**
 * A monotonically increasing step number for the phase at `elapsed`
 * (breath * PHASES.length + phase index), so a reaction can tell when a new phase begins.
 */
export function phaseStep(elapsed: number, t: BreathTiming) {
  'worklet';
  const breath = Math.floor(elapsed);
  const c = elapsed - breath;
  return breath * 4 + (c < t.inhaleEnd ? 0 : c < t.exhaleStart ? 1 : c < t.exhaleEnd ? 2 : 3);
}

/** How full the lungs are (0..1) at `elapsed`, eased for a natural rise and fall. */
export function breathAmount(elapsed: number, t: BreathTiming) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
  if (c < t.inhaleEnd) return ease(c / t.inhaleEnd);
  if (c < t.exhaleStart) return 1;
  if (c < t.exhaleEnd) return 1 - ease((c - t.exhaleStart) / (t.exhaleEnd - t.exhaleStart));
  return 0;
}
