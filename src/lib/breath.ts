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

/**
 * Sine ease-in-out on 0..1. Animation code must use this rather than an inline arrow: the
 * React Compiler hoists inline arrows out of worklet callbacks into plain (non-worklet)
 * module functions, which crash when called on the UI thread.
 */
export function easeInOut(x: number) {
  'worklet';
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

/**
 * Progress (0..1) of a scene that travels over a session: it advances only from the start of
 * each exhale to the end of the breath, easing to a stop, and reaches 1 on the last breath.
 * Without a session length (the home preview) it stays at 0.
 */
export function journey(elapsed: number, t: BreathTiming, breaths: number) {
  'worklet';
  if (!breaths) return 0;
  const k = Math.floor(elapsed);
  const c = elapsed - k;
  const within = c < t.exhaleStart ? 0 : easeInOut((c - t.exhaleStart) / (1 - t.exhaleStart));
  return Math.min(1, (k + within) / breaths);
}

/** How full the lungs are (0..1) at `elapsed`, eased for a natural rise and fall. */
export function breathAmount(elapsed: number, t: BreathTiming) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  if (c < t.inhaleEnd) return easeInOut(c / t.inhaleEnd);
  if (c < t.exhaleStart) return 1;
  if (c < t.exhaleEnd) return 1 - easeInOut((c - t.exhaleStart) / (t.exhaleEnd - t.exhaleStart));
  return 0;
}
