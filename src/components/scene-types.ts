import type { SharedValue } from 'react-native-reanimated';

import type { BreathTiming } from '@/lib/breath';

/** Props every scene's full-screen artwork receives; all motion is derived from `elapsed`. */
export type SceneVisualProps = {
  width: number;
  height: number;
  /** Breaths elapsed as a float: the integer part counts breaths, the fraction is progress through one. */
  elapsed: SharedValue<number>;
  /** 1 while the scene should start in its "breathed in" state, skipping the first return animation. */
  fresh: SharedValue<number>;
  timing: BreathTiming;
  reduceMotion?: boolean;
  showRing?: boolean;
};
