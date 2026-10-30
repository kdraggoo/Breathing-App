import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { WindStreak } from '@/components/wind-streak';
import { pinwheelColors } from '@/constants/theme';
import { breathAmount, type BreathTiming } from '@/lib/breath';

/** Degrees turned while the exhale spins the pinwheel up. */
const SPIN_UP = 540;

/**
 * Pinwheel angle in degrees at `elapsed`, as a pure function of the breath clock.
 * Measured from the start of each exhale: it accelerates through the exhale, then
 * decelerates evenly through the hold after and the next inhale, and stays still
 * during the hold after breathing in.
 */
function pinwheelAngle(elapsed: number, t: BreathTiming, fresh: number) {
  'worklet';
  const shifted = elapsed - t.exhaleStart;
  const cycle = Math.floor(shifted);
  // Still until the session's first exhale (including after "Again" restarts the clock).
  if (fresh || cycle < 0) return 0;
  const u = shifted - cycle;
  const exhale = t.exhaleEnd - t.exhaleStart;
  const coast = 1 - t.exhaleStart + t.inhaleEnd - exhale; // hold after + next inhale
  const speed = (2 * SPIN_UP) / exhale; // at the end of the exhale
  const perBreath = SPIN_UP + (speed * coast) / 2;
  let within: number;
  if (u < exhale) {
    const e = u / exhale;
    within = SPIN_UP * e * e;
  } else if (u < exhale + coast) {
    const tau = u - exhale;
    within = SPIN_UP + speed * tau - (speed * tau * tau) / (2 * coast);
  } else {
    within = perBreath;
  }
  return cycle * perBreath + within;
}

export function Pinwheel({ width, height, elapsed, fresh, timing, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const R = Math.min(width * 0.3, height * 0.18, 130);
  const cx = width / 2;
  const cy = height * 0.4;

  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.2 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });
  const bladesStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${pinwheelAngle(elapsed.value, timing, fresh.value) * (reduceMotion ? 0.25 : 1)}deg` }],
  }));

  if (width === 0 || height === 0) return null;

  const box = (r: number) => ({ position: 'absolute' as const, left: cx - r, top: cy - r, width: r * 2, height: r * 2 });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {showRing && (
        <Animated.View style={[box(R * 1.45), { borderRadius: R * 1.45, backgroundColor: '#FFFFFF' }, ringStyle]} />
      )}
      <Stick width={width} height={height} cx={cx} cy={cy} R={R} />
      {[0, 1, 2].map((i) => (
        <WindStreak
          key={i}
          index={i}
          count={3}
          left={cx - R * 1.9}
          top={cy + R * (0.55 + i * 0.28)}
          width={R * 0.9}
          angle={-22}
          travel={R * 0.9}
          elapsed={elapsed}
          timing={timing}
        />
      ))}
      <Animated.View style={[box(R), bladesStyle]}>
        <Blades R={R} />
      </Animated.View>
      <Svg style={box(R * 0.12)} width={R * 0.24} height={R * 0.24}>
        <Circle cx={R * 0.12} cy={R * 0.12} r={R * 0.09} fill="#FFFFFF" stroke={pinwheelColors.pin} strokeWidth={R * 0.03} />
      </Svg>
    </View>
  );
}

// Four curled sails, drawn pointing up from the center and rotated into place.
const Blades = memo(function Blades({ R }: { R: number }) {
  const c = R;
  const L = R * 0.95;
  const sail = `M${c} ${c} L${c} ${c - L} Q${c + L * 0.78} ${c - L * 0.92} ${c + L * 0.55} ${c - L * 0.3} Z`;
  const fold = `M${c} ${c} L${c} ${c - L} L${c + L * 0.22} ${c - L * 0.5} Z`;
  return (
    <Svg width={R * 2} height={R * 2}>
      {pinwheelColors.blades.map(([fill, shade], i) => (
        <G key={i} rotation={i * 90} origin={`${c}, ${c}`}>
          <Path d={sail} fill={fill} />
          <Path d={fold} fill={shade} />
        </G>
      ))}
    </Svg>
  );
});

const Stick = memo(function Stick({ width, height, cx, cy, R }: { width: number; height: number; cx: number; cy: number; R: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Path d={`M${cx} ${cy} L${cx + R * 0.05} ${height + 20}`} stroke={pinwheelColors.stick} strokeWidth={R * 0.1} strokeLinecap="round" />
    </Svg>
  );
});
