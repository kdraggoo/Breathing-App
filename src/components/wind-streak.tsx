import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import type { BreathTiming } from '@/lib/breath';

type Props = {
  /** Which of a group of streaks this is (0, 1, 2...); staggers their timing. */
  index: number;
  count: number;
  left: number;
  top: number;
  width: number;
  /** Rotation of the streak's path, in degrees. */
  angle: number;
  /** How far it slides along its path while visible. */
  travel: number;
  elapsed: SharedValue<number>;
  timing: BreathTiming;
};

/** A wavy gust line that flows along its path, twice per exhale, only while blowing out. */
export function WindStreak({ index, count, left, top, width, angle, travel, elapsed, timing }: Props) {
  const style = useAnimatedStyle(() => {
    const c = elapsed.value - Math.floor(elapsed.value);
    if (c < timing.exhaleStart || c >= timing.exhaleEnd) return { opacity: 0, transform: [{ translateX: 0 }] };
    const e = (c - timing.exhaleStart) / (timing.exhaleEnd - timing.exhaleStart);
    const local = (e * 2 + index / count) % 1;
    return {
      opacity: 0.85 * Math.sin(Math.PI * local) * Math.sin(Math.PI * e),
      transform: [{ translateX: local * travel }],
    };
  });
  return (
    <Animated.View style={{ position: 'absolute', left, top, width, height: 20, transform: [{ rotate: `${angle}deg` }] }}>
      <Animated.View style={style}>
        <Svg width={width} height={20}>
          <Path
            d={`M2 10 Q${width * 0.25} 2 ${width * 0.5} 10 T${width - 2} 10`}
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
