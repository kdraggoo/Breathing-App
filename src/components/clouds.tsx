import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { sunColors } from '@/constants/theme';
import { breathAmount, type BreathTiming, easeInOut } from '@/lib/breath';

type Cloud = {
  /** Home position relative to the sun's center, in sun radii. */
  x: number;
  y: number;
  scale: number;
  /** -1 blows off to the left, 1 to the right. */
  dir: -1 | 1;
  /** When during the exhale (0..1) this cloud starts to move. */
  release: number;
  /** Upward drift while leaving, as a fraction of screen height. */
  lift: number;
};

// Arranged to cover the sun; the big middle cloud leaves last so the sun appears at the end of the exhale.
const CLOUDS: Cloud[] = [
  { x: -0.95, y: -0.45, scale: 1.0, dir: -1, release: 0.05, lift: 0.1 },
  { x: 0.85, y: -0.75, scale: 0.9, dir: 1, release: 0.15, lift: 0.18 },
  { x: -0.25, y: -1.25, scale: 0.8, dir: -1, release: 0.2, lift: 0.22 },
  { x: -1.25, y: 0.65, scale: 0.95, dir: -1, release: 0.25, lift: 0.05 },
  { x: 1.15, y: 0.55, scale: 1.0, dir: 1, release: 0.3, lift: 0.08 },
  { x: 0.45, y: 1.0, scale: 0.85, dir: 1, release: 0.4, lift: 0.04 },
  { x: 0, y: 0.05, scale: 1.3, dir: 1, release: 0.5, lift: 0.12 },
];

const FLIGHT = 0.45; // share of the exhale each cloud takes to leave

/** How much of the sun is showing (0..1) at `elapsed`. */
function revealAmount(elapsed: number, t: BreathTiming, fresh: number) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  if (c < t.inhaleEnd) return fresh ? 0 : 1 - easeInOut(Math.min(1, c / (t.inhaleEnd * 0.85)));
  if (c < t.exhaleStart) return 0;
  if (c < t.exhaleEnd) return easeInOut((c - t.exhaleStart) / (t.exhaleEnd - t.exhaleStart));
  return 1;
}

export function Clouds({ width, height, elapsed, fresh, timing, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const R = Math.min(width * 0.17, height * 0.1, 80);
  const cx = width / 2;
  const cy = Math.max(R * 2.6, height * 0.34);

  const dimStyle = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - revealAmount(elapsed.value, timing, fresh.value)),
  }));
  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.2 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });
  const glowStyle = useAnimatedStyle(() => {
    const r = revealAmount(elapsed.value, timing, fresh.value);
    return { opacity: 0.8 * r, transform: [{ scale: 1 + 0.25 * r }] };
  });
  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + 0.12 * revealAmount(elapsed.value, timing, fresh.value) }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reduceMotion ? 0 : elapsed.value * 25}deg` }],
  }));

  if (width === 0 || height === 0) return null;

  const box = (r: number) => ({ position: 'absolute' as const, left: cx - r, top: cy - r, width: r * 2, height: r * 2 });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: sunColors.dim }, dimStyle]} />
      {showRing && (
        <Animated.View
          style={[box(R * 2.6), { borderRadius: R * 2.6, backgroundColor: '#FFFFFF' }, ringStyle]}
        />
      )}
      <Animated.View style={[box(R * 2), { borderRadius: R * 2, backgroundColor: sunColors.glow }, glowStyle]} />
      <Animated.View style={[box(R * 1.6), sunStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, raysStyle]}>
          <SunRays R={R} />
        </Animated.View>
        <SunFace R={R} />
      </Animated.View>
      {CLOUDS.map((cloud, i) => (
        <CloudView
          key={i}
          cloud={cloud}
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
    </View>
  );
}

type CloudViewProps = {
  cloud: Cloud;
  R: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  elapsed: SharedValue<number>;
  fresh: SharedValue<number>;
  timing: BreathTiming;
  reduceMotion: boolean;
};

function CloudView({ cloud, R, cx, cy, width, height, elapsed, fresh, timing, reduceMotion }: CloudViewProps) {
  const u = R * cloud.scale; // cloud drawing unit
  const w = u * 2.4;
  const h = u * 1.45;
  const style = useAnimatedStyle(() => {
    const c = elapsed.value - Math.floor(elapsed.value);
    // away: 0 = covering the sun, 1 = fully blown off screen.
    let away = 0;
    let opacity = 1;
    if (c < timing.inhaleEnd) {
      // Clouds drift back in over the first part of each inhale.
      if (fresh.value === 0) {
        const back = easeInOut(Math.min(1, c / (timing.inhaleEnd * 0.85)));
        away = 1 - back;
        opacity = back;
      }
    } else if (c >= timing.exhaleStart) {
      const e = Math.min(1, (c - timing.exhaleStart) / (timing.exhaleEnd - timing.exhaleStart));
      const fly = Math.min(1, Math.max(0, (e - cloud.release) / FLIGHT));
      away = fly * fly;
      opacity = fly < 0.75 ? 1 : 1 - (fly - 0.75) / 0.25;
    }
    const motion = reduceMotion ? 0.12 : 1;
    return {
      opacity,
      transform: [
        { translateX: away * cloud.dir * width * 0.85 * motion },
        { translateY: -away * cloud.lift * height * motion },
      ],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: cx + cloud.x * R - w / 2, top: cy + cloud.y * R - h / 2, width: w, height: h }, style]}
    >
      <CloudShape u={u} />
    </Animated.View>
  );
}

// A puffy cloud in a 2.4u × 1.45u box: a shaded copy offset downward, then the white cloud on top.
const CloudShape = memo(function CloudShape({ u }: { u: number }) {
  const puffs = (dy: number, fill: string) => (
    <>
      <Ellipse cx={u * 1.2} cy={u * 1.0 + dy} rx={u * 1.1} ry={u * 0.36} fill={fill} />
      <Circle cx={u * 0.6} cy={u * 0.85 + dy} r={u * 0.42} fill={fill} />
      <Circle cx={u * 1.08} cy={u * 0.62 + dy} r={u * 0.55} fill={fill} />
      <Circle cx={u * 1.62} cy={u * 0.76 + dy} r={u * 0.45} fill={fill} />
      <Circle cx={u * 1.98} cy={u * 0.98 + dy} r={u * 0.32} fill={fill} />
    </>
  );
  return (
    <Svg width={u * 2.4} height={u * 1.45}>
      {puffs(u * 0.08, sunColors.cloudShade)}
      {puffs(0, sunColors.cloud)}
    </Svg>
  );
});

const SunRays = memo(function SunRays({ R }: { R: number }) {
  const c = R * 1.6;
  return (
    <Svg width={c * 2} height={c * 2}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <Line
            key={i}
            x1={c + Math.sin(a) * R * 1.18}
            y1={c - Math.cos(a) * R * 1.18}
            x2={c + Math.sin(a) * R * 1.5}
            y2={c - Math.cos(a) * R * 1.5}
            stroke={sunColors.rays}
            strokeWidth={R * 0.14}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
});

// The sun's body with a sleepy, content face (closed eyes, smile, rosy cheeks).
const SunFace = memo(function SunFace({ R }: { R: number }) {
  const c = R * 1.6;
  const eye = (dx: number) =>
    `M${c + dx - R * 0.17} ${c - R * 0.12} Q${c + dx} ${c + R * 0.02} ${c + dx + R * 0.17} ${c - R * 0.12}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width={c * 2} height={c * 2}>
      <Circle cx={c} cy={c} r={R} fill={sunColors.body} />
      <Circle cx={c - R * 0.52} cy={c + R * 0.22} r={R * 0.15} fill={sunColors.cheek} opacity={0.55} />
      <Circle cx={c + R * 0.52} cy={c + R * 0.22} r={R * 0.15} fill={sunColors.cheek} opacity={0.55} />
      <Path d={eye(-R * 0.36)} stroke={sunColors.face} strokeWidth={R * 0.07} strokeLinecap="round" fill="none" />
      <Path d={eye(R * 0.36)} stroke={sunColors.face} strokeWidth={R * 0.07} strokeLinecap="round" fill="none" />
      <Path
        d={`M${c - R * 0.28} ${c + R * 0.3} Q${c} ${c + R * 0.55} ${c + R * 0.28} ${c + R * 0.3}`}
        stroke={sunColors.face}
        strokeWidth={R * 0.07}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
});
