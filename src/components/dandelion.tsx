import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { colors } from '@/constants/theme';
import { breathAmount, type BreathTiming } from '@/lib/breath';

type Timing = BreathTiming;
type Props = SceneVisualProps;

type Seed = {
  angle: number;
  length: number;
  opacity: number;
  release: number;
  dx: number;
  dy: number;
  spin: number;
  sway: number;
  swayFreq: number;
};

const SEED_COUNT = 52;
const OUTER_RING = 36;

function makeSeeds(): Seed[] {
  let s = 42;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  return Array.from({ length: SEED_COUNT }, (_, i) => {
    const inner = i >= OUTER_RING;
    const ringSize = inner ? SEED_COUNT - OUTER_RING : OUTER_RING;
    const idx = inner ? i - OUTER_RING : i;
    return {
      angle: (idx / ringSize) * 360 + (inner ? 180 / ringSize : 0) + (rand() - 0.5) * 6,
      length: inner ? 0.6 + rand() * 0.1 : 0.9 + rand() * 0.1,
      opacity: inner ? 0.75 : 1,
      release: rand() * 0.55,
      dx: 0.5 + rand() * 0.7,
      dy: -(0.15 + rand() * 0.45),
      spin: (rand() - 0.5) * 140,
      sway: 8 + rand() * 18,
      swayFreq: 1 + rand() * 2,
    };
  });
}

const SEEDS = makeSeeds();

export function Dandelion({ width, height, elapsed, fresh, timing, reduceMotion = false, showRing = true }: Props) {
  const R = Math.min(width * 0.3, height * 0.24, 140);
  const cx = width / 2;
  const cy = Math.max(R * 1.4, height * 0.36);

  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.25 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });
  const headStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { transform: [{ scale: 1 + 0.06 * b }] };
  });

  if (width === 0 || height === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Stem width={width} height={height} cx={cx} cy={cy} />
      {showRing && (
        <Animated.View
          style={[
            styles.ring,
            { left: cx - R * 1.35, top: cy - R * 1.35, width: R * 2.7, height: R * 2.7, borderRadius: R * 1.35 },
            ringStyle,
          ]}
        />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [cx, cy, 0] }, headStyle]}>
        {SEEDS.map((seed, i) => (
          <SeedView
            key={i}
            seed={seed}
            R={R}
            cx={cx}
            cy={cy}
            width={width}
            height={height}
            elapsed={elapsed}
            fresh={fresh}
            timing={timing}
            reduceMotion={reduceMotion}
          />
        ))}
        <Svg style={{ position: 'absolute', left: cx - R * 0.14, top: cy - R * 0.14 }} width={R * 0.28} height={R * 0.28}>
          <Circle cx={R * 0.14} cy={R * 0.14} r={R * 0.12} fill={colors.core} />
        </Svg>
      </Animated.View>
    </View>
  );
}

type SeedProps = {
  seed: Seed;
  R: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  elapsed: SharedValue<number>;
  fresh: SharedValue<number>;
  timing: Timing;
  reduceMotion: boolean;
};

function SeedView({ seed, R, cx, cy, width, height, elapsed, fresh, timing, reduceMotion }: SeedProps) {
  const L = R * seed.length;
  const style = useAnimatedStyle(() => {
    const c = elapsed.value - Math.floor(elapsed.value);
    let regrow = 1;
    let fly = 0;
    if (c < timing.inhaleEnd) {
      // Seeds grow back during the first part of each inhale.
      if (fresh.value === 0) regrow = Math.min(1, c / (timing.inhaleEnd * 0.7));
    } else if (c >= timing.exhaleStart) {
      // Each seed lets go at its own moment during the exhale and drifts off with the wind;
      // all are gone by the end of the exhale, leaving the head bare for the hold that follows.
      const e = Math.min(1, (c - timing.exhaleStart) / (timing.exhaleEnd - timing.exhaleStart));
      fly = Math.min(1, Math.max(0, (e - seed.release) / 0.45));
    }
    const motion = reduceMotion ? 0.06 : 1;
    const travel = fly * fly;
    const x = (travel * seed.dx * width + Math.sin(fly * Math.PI * seed.swayFreq) * seed.sway * fly) * motion;
    const y = travel * seed.dy * height * motion;
    return {
      opacity: seed.opacity * regrow * (1 - fly * fly * fly),
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${seed.angle + seed.spin * fly * motion}deg` },
        { scale: 0.4 + 0.6 * regrow },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: cx - L, top: cy - L, width: L * 2, height: L * 2 }, style]}>
      <SeedShape L={L} />
    </Animated.View>
  );
}

// One seed drawn pointing straight up from the view's center; the parent rotates it into place.
const SeedShape = memo(function SeedShape({ L }: { L: number }) {
  const tipY = L * 0.22;
  const tuft = Array.from({ length: 9 }, (_, k) => {
    const a = ((-72 + k * 18) * Math.PI) / 180;
    const len = L * 0.2;
    return `M${L} ${tipY} L${L + Math.sin(a) * len} ${tipY - Math.cos(a) * len}`;
  }).join(' ');
  return (
    <Svg width={L * 2} height={L * 2}>
      <Line x1={L} y1={L * 0.86} x2={L} y2={tipY} stroke={colors.seedStalk} strokeWidth={1.2} />
      <Path d={tuft} stroke={colors.seedTuft} strokeWidth={1.1} strokeLinecap="round" />
      <Ellipse cx={L} cy={L * 0.84} rx={1.4} ry={3} fill="#8A7A5C" />
    </Svg>
  );
});

const Stem = memo(function Stem({ width, height, cx, cy }: { width: number; height: number; cx: number; cy: number }) {
  const base = height;
  const leaf = (dir: 1 | -1) =>
    `M${cx - 6} ${base} Q${cx + dir * 46} ${base - 70} ${cx + dir * 70} ${base - 120} Q${cx + dir * 20} ${base - 60} ${cx - 2} ${base}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Path
        d={`M${cx} ${cy} C${cx + 14} ${cy + (base - cy) * 0.4} ${cx - 18} ${cy + (base - cy) * 0.7} ${cx - 6} ${base}`}
        stroke={colors.stem}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Path d={leaf(-1)} fill={colors.stem} />
      <Path d={leaf(1)} fill={colors.hillShade} />
    </Svg>
  );
});

const styles = StyleSheet.create({
  ring: { position: 'absolute', backgroundColor: '#FFFFFF' },
});
