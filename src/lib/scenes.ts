import type { ComponentType } from 'react';

import { Balloon } from '@/components/balloon';
import { Bubbles } from '@/components/bubbles';
import { Clouds } from '@/components/clouds';
import { Dandelion } from '@/components/dandelion';
import { Pinwheel } from '@/components/pinwheel';
import { Sailboat } from '@/components/sailboat';
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
  {
    id: 'bubbles',
    name: 'Bubbles',
    tagline: 'Breathe in slowly, then blow gently to make bubbles.',
    Visual: Bubbles,
    hints: { exhale: 'Blow gently to make bubbles', holdOut: 'Watch them float and pop' },
    done: (n) => `You blew ${n} streams of bubbles.`,
  },
  {
    id: 'pinwheel',
    name: 'Pinwheel',
    tagline: 'Breathe in slowly, then blow to make the pinwheel spin.',
    Visual: Pinwheel,
    hints: { exhale: 'Blow to make it spin', holdOut: 'Watch it slow down' },
    done: (n) => `You spun the pinwheel ${n} times.`,
  },
  {
    id: 'sailboat',
    name: 'Sailboat',
    tagline: 'Breathe in slowly, then blow into the sail to cross the lake.',
    Visual: Sailboat,
    hints: { exhale: 'Blow into the sail', holdOut: 'Glide across the water' },
    done: () => 'You sailed all the way to the island.',
  },
  {
    id: 'balloon',
    name: 'Hot Air Balloon',
    tagline: 'Breathe in to fill the balloon, then breathe out to float over the hills.',
    Visual: Balloon,
    hints: { inhale: 'Slowly fill the balloon', exhale: 'Let it drift over the hills', holdOut: 'Float along' },
    done: () => 'Your balloon floated all the way across the sky.',
  },
];

export function getScene(id: string | undefined) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
