import type { ComponentType } from 'react';

import { Clouds } from '@/components/clouds';
import { Dandelion } from '@/components/dandelion';
import type { SceneVisualProps } from '@/components/scene-types';
import type { SceneId } from '@/constants/theme';
import type { Phase } from '@/lib/breath';

export type Scene = {
  id: SceneId;
  name: string;
  /** One line under the title on the home screen. */
  tagline: string;
  Visual: ComponentType<SceneVisualProps>;
  /** Overrides for the default phase hints shown during a session. */
  hints: Partial<Record<Phase, string>>;
  /** Message on the completion card. */
  done: (breaths: number) => string;
};

export const SCENES: Scene[] = [
  {
    id: 'dandelion',
    name: 'Dandelion',
    tagline: 'Breathe in slowly, then blow the seeds away.',
    Visual: Dandelion,
    hints: { exhale: 'Blow the seeds away' },
    done: (n) => `You blew away ${n} dandelions.`,
  },
  {
    id: 'clouds',
    name: 'Sunny Sky',
    tagline: 'Breathe in slowly, then blow the clouds away to find the sun.',
    Visual: Clouds,
    hints: { exhale: 'Blow the clouds away', holdOut: 'Feel the warm sunshine' },
    done: (n) => `You found the sun ${n} times.`,
  },
];

export function getScene(id: string | undefined) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
