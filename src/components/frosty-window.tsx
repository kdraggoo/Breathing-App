import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { windowColors } from '@/constants/theme';
import { breathAmount, type BreathTiming } from '@/lib/breath';

/*
 * Physics this scene follows: warm, humid exhaled air condenses on cold glass almost
 * instantly, so the fog patch blooms during the exhale from where the breath lands. Once
 * the breath stops it evaporates over a few seconds, thinnest film (the edges) first, so it
 * clears from the outside in through the hold after and the next inhale. Finger oil left
 * on the glass changes how water condenses, so an old finger drawing shows through the fog.
 */

const FOG_LAYERS = 4; // concentric rings, outermost first
const DRAWINGS = 3; // heart, star, smiley, one per breath in turn

type FogPhase = { cycle: number; forming: number; clearing: number; active: boolean };

/** Where we are in the fog's life, measured from the start of each exhale. */
function fogPhase(elapsed: number, t: BreathTiming, fresh: number): FogPhase {
  'worklet';
  const shifted = elapsed - t.exhaleStart;
  const cycle = Math.floor(shifted);
  // Clear glass until the session's first exhale (including after "Again").
  if (fresh || cycle < 0) return { cycle, forming: 0, clearing: 0, active: false };
  const u = shifted - cycle;
  const exhale = t.exhaleEnd - t.exhaleStart;
  const clear = 1 - t.exhaleStart + t.inhaleEnd - exhale; // hold after + next inhale
  if (u < exhale) return { cycle, forming: u / exhale, clearing: 0, active: true };
  if (u < exhale + clear) return { cycle, forming: 1, clearing: (u - exhale) / clear, active: true };
  return { cycle, forming: 1, clearing: 1, active: false };
}

/** Opacity of fog ring `k` (0 = outermost): every ring fades in together, then edges clear first. */
function fogLayerOpacity(k: number, p: FogPhase) {
  'worklet';
  if (!p.active) return 0;
  if (p.clearing === 0) return Math.min(1, p.forming / 0.15);
  return 1 - Math.min(1, Math.max(0, (p.clearing - k * 0.15) / 0.4));
}

/** The fog patch spreads quickly from the breath, then slows. */
function fogScale(p: FogPhase) {
  'worklet';
  const f = p.forming;
  return 0.25 + 0.75 * (1 - (1 - f) * (1 - f));
}

type Flake = { x: number; y: number; speed: number; drift: number; freq: number; phase: number; r: number };

function makeFlakes(): Flake[] {
  let s = 23;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  return Array.from({ length: 36 }, () => ({
    x: rand(),
    y: rand(),
    speed: 0.25 + rand() * 0.2, // glass heights per breath
    drift: 4 + rand() * 8,
    freq: 2 + rand() * 3,
    phase: rand() * 6.28,
    r: 1.5 + rand() * 2,
  }));
}

const FLAKES = makeFlakes();

export function FrostyWindow({ width, height, elapsed, fresh, timing, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const winW = Math.min(width * 0.82, height * 0.4, 340);
  const winH = winW * 1.15;
  const frame = winW * 0.06;
  const winLeft = (width - winW) / 2;
  const winTop = height * 0.24;
  const gw = winW - frame * 2;
  const gh = winH - frame * 2;
  const fogX = gw * 0.5;
  const fogY = gh * 0.6;
  const fogR = gw * 0.48;

  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.25 + 0.25 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });

  if (width === 0 || height === 0) return null;

  const haloR = winH * 0.62;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Wall width={width} height={height} />
      {showRing && (
        // The breath guide pulses as a halo around the window, not on the glass, so it never looks like fog.
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: width / 2 - haloR,
              top: winTop + winH / 2 - haloR,
              width: haloR * 2,
              height: haloR * 2,
              borderRadius: haloR,
              backgroundColor: '#FFFFFF',
            },
            ringStyle,
          ]}
        />
      )}
      <WindowFrame width={width} height={height} winLeft={winLeft} winTop={winTop} winW={winW} winH={winH} frame={frame} />
      <View style={{ position: 'absolute', left: winLeft + frame, top: winTop + frame, width: gw, height: gh, overflow: 'hidden' }}>
        <Outside gw={gw} gh={gh} />
        {FLAKES.map((flake, i) => (
          <Snowflake key={i} flake={flake} gw={gw} gh={gh} elapsed={elapsed} reduceMotion={reduceMotion} />
        ))}
        {Array.from({ length: FOG_LAYERS }, (_, k) => (
          <FogRing key={k} k={k} r={fogR * (1 - k * 0.18)} cx={fogX} cy={fogY} elapsed={elapsed} fresh={fresh} timing={timing} />
        ))}
        {Array.from({ length: DRAWINGS }, (_, d) => (
          <Drawing key={d} index={d} size={fogR * 0.7} cx={fogX} cy={fogY} elapsed={elapsed} fresh={fresh} timing={timing} />
        ))}
        <FrostCorners gw={gw} gh={gh} />
      </View>
    </View>
  );
}

type FogRingProps = { k: number; r: number; cx: number; cy: number; elapsed: SharedValue<number>; fresh: SharedValue<number>; timing: BreathTiming };

function FogRing({ k, r, cx, cy, elapsed, fresh, timing }: FogRingProps) {
  const style = useAnimatedStyle(() => {
    const p = fogPhase(elapsed.value, timing, fresh.value);
    return { opacity: 0.4 * fogLayerOpacity(k, p), transform: [{ scale: fogScale(p) }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2 }, style]}>
      <Svg width={r * 2} height={r * 2}>
        <Defs>
          <RadialGradient id={`fog${k}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={windowColors.fog} stopOpacity={1} />
            <Stop offset="0.6" stopColor={windowColors.fog} stopOpacity={0.75} />
            <Stop offset="1" stopColor={windowColors.fog} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#fog${k})`} />
      </Svg>
    </Animated.View>
  );
}

type DrawingProps = { index: number; size: number; cx: number; cy: number; elapsed: SharedValue<number>; fresh: SharedValue<number>; timing: BreathTiming };

// An old finger drawing that shows up as clear lines in the fog, a different one each breath.
function Drawing({ index, size, cx, cy, elapsed, fresh, timing }: DrawingProps) {
  const style = useAnimatedStyle(() => {
    const p = fogPhase(elapsed.value, timing, fresh.value);
    if (!p.active || p.cycle % DRAWINGS !== index) return { opacity: 0 };
    // Shows once the fog is dense, and goes with the inner fog as it clears.
    const shown = Math.min(1, Math.max(0, (p.forming - 0.3) / 0.3));
    return { opacity: 0.85 * shown * fogLayerOpacity(2, p) };
  });
  const s = size;
  const c = s / 2;
  const paths = [
    // heart
    `M${c} ${s * 0.85} C${s * 0.05} ${s * 0.45} ${s * 0.15} ${s * 0.08} ${c} ${s * 0.3} C${s * 0.85} ${s * 0.08} ${s * 0.95} ${s * 0.45} ${c} ${s * 0.85} Z`,
    // star
    Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const rr = i % 2 ? s * 0.2 : s * 0.45;
      return `${i ? 'L' : 'M'}${c + Math.cos(a) * rr} ${c + Math.sin(a) * rr}`;
    }).join(' ') + ' Z',
    // smiley
    `M${c - s * 0.4} ${c} A${s * 0.4} ${s * 0.4} 0 1 0 ${c + s * 0.4} ${c} A${s * 0.4} ${s * 0.4} 0 1 0 ${c - s * 0.4} ${c} M${c - s * 0.14} ${c - s * 0.12} L${c - s * 0.14} ${c - s * 0.05} M${c + s * 0.14} ${c - s * 0.12} L${c + s * 0.14} ${c - s * 0.05} M${c - s * 0.2} ${c + s * 0.1} Q${c} ${c + s * 0.3} ${c + s * 0.2} ${c + s * 0.1}`,
  ];
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - c, top: cy - c, width: s, height: s }, style]}>
      <Svg width={s} height={s}>
        <Path d={paths[index]} stroke={windowColors.clearLine} strokeWidth={s * 0.06} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

type SnowflakeProps = { flake: Flake; gw: number; gh: number; elapsed: SharedValue<number>; reduceMotion: boolean };

function Snowflake({ flake, gw, gh, elapsed, reduceMotion }: SnowflakeProps) {
  const style = useAnimatedStyle(() => {
    const t = reduceMotion ? 0 : elapsed.value;
    return {
      transform: [
        { translateX: flake.x * gw + Math.sin(t * flake.freq + flake.phase) * flake.drift },
        { translateY: ((flake.y + t * flake.speed) % 1) * (gh + 10) - 5 },
      ],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: -flake.r, top: -flake.r, width: flake.r * 2, height: flake.r * 2, borderRadius: flake.r, backgroundColor: '#FFFFFF' }, style]}
    />
  );
}

// The snowy evening seen through the glass: sky, a few stars, hills, pines and a snowman.
const Outside = memo(function Outside({ gw, gh }: { gw: number; gh: number }) {
  const ground = gh * 0.7;
  const pine = (x: number, base: number, h: number) => (
    <>
      <Path d={`M${x} ${base - h} L${x + h * 0.36} ${base} L${x - h * 0.36} ${base} Z`} fill={windowColors.pine} />
      <Path d={`M${x} ${base - h} L${x + h * 0.14} ${base - h * 0.62} L${x - h * 0.14} ${base - h * 0.62} Z`} fill="#FFFFFF" opacity={0.9} />
    </>
  );
  const sx = gw * 0.68;
  const sy = ground + gh * 0.08;
  const u = gw * 0.07;
  return (
    <Svg style={StyleSheet.absoluteFill} width={gw} height={gh}>
      <Defs>
        <LinearGradient id="evening" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={windowColors.skyTop} />
          <Stop offset="1" stopColor={windowColors.skyBottom} />
        </LinearGradient>
      </Defs>
      <Rect width={gw} height={gh} fill="url(#evening)" />
      {[
        [0.15, 0.12],
        [0.42, 0.07],
        [0.78, 0.15],
        [0.6, 0.25],
        [0.25, 0.3],
      ].map(([fx, fy], i) => (
        <Circle key={i} cx={gw * fx} cy={gh * fy} r={1.4} fill="#FFFFFF" opacity={0.8} />
      ))}
      <Path d={`M0 ${ground} Q${gw * 0.3} ${ground - gh * 0.08} ${gw * 0.6} ${ground} T${gw} ${ground - gh * 0.04} L${gw} ${gh} L0 ${gh} Z`} fill={windowColors.snowShade} />
      {pine(gw * 0.16, ground + gh * 0.04, gh * 0.32)}
      {pine(gw * 0.3, ground + gh * 0.02, gh * 0.22)}
      {pine(gw * 0.9, ground + gh * 0.03, gh * 0.26)}
      <Path d={`M0 ${ground + gh * 0.06} Q${gw * 0.5} ${ground - gh * 0.02} ${gw} ${ground + gh * 0.08} L${gw} ${gh} L0 ${gh} Z`} fill={windowColors.snow} />
      <Circle cx={sx} cy={sy} r={u * 1.15} fill="#FFFFFF" stroke={windowColors.snowShade} strokeWidth={1.5} />
      <Circle cx={sx} cy={sy - u * 1.75} r={u * 0.8} fill="#FFFFFF" stroke={windowColors.snowShade} strokeWidth={1.5} />
      <Circle cx={sx} cy={sy - u * 2.95} r={u * 0.58} fill="#FFFFFF" stroke={windowColors.snowShade} strokeWidth={1.5} />
      <Path d={`M${sx - u * 0.6} ${sy - u * 2.45} L${sx + u * 0.6} ${sy - u * 2.45}`} stroke={windowColors.scarf} strokeWidth={u * 0.22} strokeLinecap="round" />
      <Circle cx={sx - u * 0.2} cy={sy - u * 3.05} r={u * 0.07} fill="#2B2B2B" />
      <Circle cx={sx + u * 0.2} cy={sy - u * 3.05} r={u * 0.07} fill="#2B2B2B" />
      <Path d={`M${sx} ${sy - u * 2.9} L${sx + u * 0.45} ${sy - u * 2.82} L${sx} ${sy - u * 2.76} Z`} fill={windowColors.carrot} />
    </Svg>
  );
});

// Static frost creeping in from the glass corners (frost forms over hours, so it doesn't animate).
const FrostCorners = memo(function FrostCorners({ gw, gh }: { gw: number; gh: number }) {
  const corner = (x: number, y: number, sx: number, sy: number) => {
    const r = gw * 0.22;
    return (
      <>
        <Path d={`M${x} ${y} L${x + sx * r} ${y} Q${x + sx * r * 0.35} ${y + sy * r * 0.35} ${x} ${y + sy * r} Z`} fill="#FFFFFF" opacity={0.35} />
        {[0.2, 0.5, 0.8].map((f) => (
          <Line
            key={f}
            x1={x}
            y1={y}
            x2={x + sx * r * (1 - f) * 0.9}
            y2={y + sy * r * f * 0.9}
            stroke="#FFFFFF"
            strokeOpacity={0.6}
            strokeWidth={1.2}
          />
        ))}
      </>
    );
  };
  return (
    <Svg style={StyleSheet.absoluteFill} width={gw} height={gh}>
      {corner(0, 0, 1, 1)}
      {corner(gw, 0, -1, 1)}
      {corner(0, gh, 1, -1)}
      {corner(gw, gh, -1, -1)}
    </Svg>
  );
});

// Cozy wall behind everything.
const Wall = memo(function Wall({ width, height }: { width: number; height: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Rect width={width} height={height} fill={windowColors.wall} />
    </Svg>
  );
});

type WindowFrameProps = { width: number; height: number; winLeft: number; winTop: number; winW: number; winH: number; frame: number };

// The window frame and a wooden sill, drawn over the breath halo.
const WindowFrame = memo(function WindowFrame({ width, height, winLeft, winTop, winW, winH, frame }: WindowFrameProps) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Rect x={winLeft} y={winTop} width={winW} height={winH} rx={frame * 0.4} fill={windowColors.frame} />
      <Rect x={winLeft + frame * 0.55} y={winTop + frame * 0.55} width={winW - frame * 1.1} height={winH - frame * 1.1} fill={windowColors.frameShade} />
      <Rect x={winLeft - frame * 0.8} y={winTop + winH - frame * 0.2} width={winW + frame * 1.6} height={frame * 1.2} rx={frame * 0.3} fill={windowColors.sill} />
    </Svg>
  );
});
