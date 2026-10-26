import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { PHASE_LIMITS, PRESETS, type PhaseDurations } from '@/constants/theme';

export type Settings = PhaseDurations & {
  sound: boolean;
  haptics: boolean;
  breaths: number;
};

const KEY = 'settings';
const DEFAULTS: Settings = { sound: true, haptics: true, breaths: 5, ...PRESETS[0].durations };

function clampPhase(phase: keyof PhaseDurations, value: unknown, fallback: number) {
  const { min, max } = PHASE_LIMITS[phase];
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

function load(): Settings {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return DEFAULTS;
    const saved = { ...DEFAULTS, ...JSON.parse(raw) };
    return {
      sound: saved.sound,
      haptics: saved.haptics,
      breaths: saved.breaths,
      inhale: clampPhase('inhale', saved.inhale, DEFAULTS.inhale),
      hold: clampPhase('hold', saved.hold, DEFAULTS.hold),
      exhale: clampPhase('exhale', saved.exhale, DEFAULTS.exhale),
    };
  } catch {
    return DEFAULTS;
  }
}

let current = load();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    Storage.setItemSync(KEY, JSON.stringify(current));
  } catch {
    // Persisting is best-effort; the in-memory value still applies.
  }
  listeners.forEach((l) => l());
}

export function useSettings() {
  return useSyncExternalStore(subscribe, () => current);
}
