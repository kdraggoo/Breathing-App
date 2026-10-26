import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import type { PaceId } from '@/constants/theme';

export type Settings = {
  sound: boolean;
  haptics: boolean;
  breaths: number;
  pace: PaceId;
};

const KEY = 'settings';
const DEFAULTS: Settings = { sound: true, haptics: true, breaths: 5, pace: 'gentle' };

function load(): Settings {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
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
