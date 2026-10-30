import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { bubbleColors } from '@/constants/theme';
import { breathAmount, type BreathTiming, easeInOut } from '@/lib/breath';

type Bubble = {
  /** When during the exhale (0..1) this bubble leaves the wand. */
  release: number;
  /** Radius relative to the wand ring's radius. */
  size: number;
  /** Sideways drift over its life, as a fraction of screen width (positive = right). */
  dx: number;
  /** Where it ends up, as a fraction of screen height from the top. */
  top: number;
  wobble: number;
  freq: number;
};

const BUBBLE_COUNT = 14;

function makeBubbles(): Bubble[] {
  let s = 11;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  return Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
    release: (i / BUBBLE_COUNT) * 0.75 + rand() * 0.04,
    size: 0.28 + rand() * 0.34,
    dx: -0.15 + rand() * 0.7,
    top: 0.06 + rand() * 0.22,
    wobble: 6 + rand() * 14,
    freq: 1 + rand() * 2,
  }));
}

const BUBBLES = makeBubbles();

/** How much soap film fills the wand (0..1) at `elapsed`. */
function filmAmount(elapsed: number, t: BreathTiming, fresh: number) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  if (c < t.inhaleEnd) return fresh ? 1 : easeInOut(c / t.inhaleEnd);
  if (c < t.exhaleStart) return 1;
  if (c < t.exhaleEnd) return 1 - easeInOut((c - t.exhaleStart) / (t.exhaleEnd - t.exhaleStart));
  return 0;
}

export function Bubbles({ width, height, elapsed, fresh, timing, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const R = Math.min(width * 0.16, height * 0.08, 70);
  const cx = width * 0.42;
  const cy = height * 0.56;

  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.2 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });
  const filmStyle = useAnimatedStyle(() => {
    const c = elapsed.value - Math.floor(elapsed.value);
    // The film bulges outward as the blowing starts.
    let bulge = 0;
    if (c >= timing.exhaleStart && c < timing.exhaleEnd) {
      const e = (c - timing.exhaleStart) / (timing.exhaleEnd - timing.exhaleStart);
      bulge = Math.sin(Math.min(1, e / 0.25) * Math.PI);
    }
    return {
      opacity: filmAmount(elapsed.value, timing, fresh.value),
      transform: [{ scale: 1 + (reduceMotion ? 0 : 0.12 * bulge) }],
    };
  });

  if (width === 0 || height === 0) return null;

  const box = (r: number) => ({ position: 'absolute' as const, left: cx - r, top: cy - r, width: r * 2, height: r * 2 });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {showRing && (
        <Animated.View style={[box(R * 2.4), { borderRadius: R * 2.4, backgroundColor: '#FFFFFF' }, ringStyle]} />
      )}
      <Animated.View style={[box(R), filmStyle]}>
        <Film R={R} />
      </Animated.View>
      <Wand width={width} height={height} cx={cx} cy={cy} R={R} />
      {BUBBLES.map((bubble, i) => (
        <BubbleView
          key={i}
          bubble={bubble}
          R={R}
          cx={cx}
          cy={cy}
          width={width}
          height={height}
          elapsed={elapsed}
          timing={timing}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

type BubbleViewProps = {
  bubble: Bubble;
  R: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  elapsed: SharedValue<number>;
  timing: BreathTiming;
  reduceMotion: boolean;
};

function BubbleView({ bubble, R, cx, cy, width, height, elapsed, timing, reduceMotion }: BubbleViewProps) {
  const d = R * bubble.size * 2;
  const style = useAnimatedStyle(() => {
    const c = elapsed.value - Math.floor(elapsed.value);
    // Each bubble lives from its release during the exhale until the end of the breath,
    // so it's gone before the next inhale whether or not there's a hold after exhaling.
    const start = timing.exhaleStart + bubble.release * (timing.exhaleEnd - timing.exhaleStart);
    if (c < start) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0 }] };
    const p = (c - start) / (1 - start);
    const emerge = Math.min(1, p / 0.08);
    const pop = p > 0.85 ? (p - 0.85) / 0.15 : 0;
    const rise = 1 - (1 - p) * (1 - p);
    const motion = reduceMotion ? 0.15 : 1;
    return {
      opacity: 1 - pop,
      transform: [
        { translateX: (bubble.dx * width * p + Math.sin(p * Math.PI * bubble.freq) * bubble.wobble) * motion },
        { translateY: -(cy - bubble.top * height) * rise * motion },
        { scale: (0.3 + 0.7 * emerge) * (1 + 0.35 * pop) },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d }, style]}>
      <BubbleShape d={d} />
    </Animated.View>
  );
}

// A soap bubble: a faint fill, white rim, two rainbow sheen arcs and a highlight.
const BubbleShape = memo(function BubbleShape({ d }: { d: number }) {
  const c = d / 2;
  const r = c - 2;
  const arc = (from: number, to: number) => {
    const a = (from * Math.PI) / 180;
    const b = (to * Math.PI) / 180;
    return `M${c + r * Math.cos(a)} ${c + r * Math.sin(a)} A${r} ${r} 0 0 1 ${c + r * Math.cos(b)} ${c + r * Math.sin(b)}`;
  };
  return (
    <Svg width={d} height={d}>
      <Circle cx={c} cy={c} r={r} fill="#FFFFFF" fillOpacity={0.16} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={1.5} />
      <Path d={arc(15, 80)} stroke={bubbleColors.sheenPink} strokeOpacity={0.7} strokeWidth={2} fill="none" />
      <Path d={arc(100, 165)} stroke={bubbleColors.sheenTeal} strokeOpacity={0.7} strokeWidth={2} fill="none" />
      <Ellipse cx={d * 0.34} cy={d * 0.3} rx={d * 0.12} ry={d * 0.07} fill="#FFFFFF" opacity={0.9} rotation={-35} origin={`${d * 0.34}, ${d * 0.3}`} />
    </Svg>
  );
});

const Film = memo(function Film({ R }: { R: number }) {
  return (
    <Svg width={R * 2} height={R * 2}>
      <Defs>
        <LinearGradient id="film" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={bubbleColors.filmA} />
          <Stop offset="0.5" stopColor={bubbleColors.filmB} />
          <Stop offset="1" stopColor={bubbleColors.filmC} />
        </LinearGradient>
      </Defs>
      <Circle cx={R} cy={R} r={R * 0.92} fill="url(#film)" opacity={0.6} />
      <Ellipse cx={R * 0.62} cy={R * 0.55} rx={R * 0.22} ry={R * 0.11} fill="#FFFFFF" opacity={0.8} rotation={-35} origin={`${R * 0.62}, ${R * 0.55}`} />
    </Svg>
  );
});

// A bubble wand: a ring on a stick angled down to the bottom of the screen.
const Wand = memo(function Wand({ width, height, cx, cy, R }: { width: number; height: number; cx: number; cy: number; R: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Path
        d={`M${cx - R * 0.15} ${cy + R} L${cx - width * 0.14} ${height + 20}`}
        stroke={bubbleColors.wand}
        strokeWidth={R * 0.24}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={R} stroke={bubbleColors.wand} strokeWidth={R * 0.18} fill="none" />
    </Svg>
  );
});
