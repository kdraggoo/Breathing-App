import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { candleColors } from '@/constants/theme';
import { breathAmount, type BreathTiming } from '@/lib/breath';

const CANDLES = 5;
// When during the exhale (0..1) each candle (left to right) goes out; not simply in order.
const RELEASE = [0.4, 0.08, 0.72, 0.24, 0.56];
const OUT_TIME = 0.06; // share of the exhale a flame takes to die

/** How lit candle `i` is (0..1) at `elapsed`. */
function flameLit(i: number, elapsed: number, t: BreathTiming, fresh: number) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  if (c < t.inhaleEnd) {
    if (fresh) return 1;
    // Relight left to right over the inhale.
    return Math.min(1, Math.max(0, (c / t.inhaleEnd - i * 0.1) / 0.3));
  }
  if (c < t.exhaleStart) return 1;
  if (c < t.exhaleEnd) {
    const e = (c - t.exhaleStart) / (t.exhaleEnd - t.exhaleStart);
    return e < RELEASE[i] ? 1 : Math.max(0, 1 - (e - RELEASE[i]) / OUT_TIME);
  }
  return 0;
}

export function Candles({ width, height, elapsed, fresh, timing, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const CW = Math.min(width * 0.72, height * 0.36, 300); // cake width
  const cx = width / 2;
  const cakeTop = height * 0.47;
  const candleW = CW * 0.05;
  const candleH = CW * 0.22;
  const candleTop = cakeTop + CW * 0.03 - candleH;
  const fw = CW * 0.065;
  const fh = CW * 0.12;
  const flameTop = candleTop - CW * 0.012 - fh;
  const xs = Array.from({ length: CANDLES }, (_, i) => cx + (i - (CANDLES - 1) / 2) * CW * 0.16);

  const glowStyle = useAnimatedStyle(() => {
    let lit = 0;
    for (let i = 0; i < CANDLES; i++) lit += flameLit(i, elapsed.value, timing, fresh.value);
    return { opacity: (0.45 * lit) / CANDLES };
  });
  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.2 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });

  if (width === 0 || height === 0) return null;

  const glowR = CW * 0.5;
  const ringR = CW * 0.5;
  const flameCy = flameTop + fh / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Room width={width} height={height} tableTop={cakeTop + CW * 0.36} />
      <Animated.View
        style={[
          { position: 'absolute', left: cx - glowR, top: flameCy - glowR, width: glowR * 2, height: glowR * 2, borderRadius: glowR, backgroundColor: candleColors.glow },
          glowStyle,
        ]}
      />
      <Bunting width={width} height={height} />
      {showRing && (
        <Animated.View
          style={[
            { position: 'absolute', left: cx - ringR, top: flameCy - ringR, width: ringR * 2, height: ringR * 2, borderRadius: ringR, backgroundColor: '#FFFFFF' },
            ringStyle,
          ]}
        />
      )}
      <Cake width={width} height={height} cx={cx} cakeTop={cakeTop} CW={CW} xs={xs} candleW={candleW} candleH={candleH} candleTop={candleTop} />
      {xs.map((x, i) => (
        <Smoke key={`s${i}`} index={i} x={x} y={flameTop} size={fw * 1.4} rise={height * 0.16} elapsed={elapsed} timing={timing} />
      ))}
      {xs.map((x, i) => (
        <Flame
          key={`f${i}`}
          index={i}
          left={x - fw / 2}
          top={flameTop}
          w={fw}
          h={fh}
          elapsed={elapsed}
          fresh={fresh}
          timing={timing}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

type FlameProps = {
  index: number;
  left: number;
  top: number;
  w: number;
  h: number;
  elapsed: SharedValue<number>;
  fresh: SharedValue<number>;
  timing: BreathTiming;
  reduceMotion: boolean;
};

function Flame({ index, left, top, w, h, elapsed, fresh, timing, reduceMotion }: FlameProps) {
  const style = useAnimatedStyle(() => {
    const lit = flameLit(index, elapsed.value, timing, fresh.value);
    const c = elapsed.value - Math.floor(elapsed.value);
    // Lean away from the breath while blowing.
    let lean = 0;
    if (c >= timing.exhaleStart && c < timing.exhaleEnd) {
      lean = Math.min(1, (c - timing.exhaleStart) / ((timing.exhaleEnd - timing.exhaleStart) * 0.12));
    }
    const flicker = reduceMotion ? 0 : Math.sin(elapsed.value * Math.PI * 14 + index * 1.7);
    return {
      opacity: lit,
      transform: [{ rotate: `${lean * 24}deg` }, { scaleY: lit * (1 + 0.08 * flicker + 0.15 * lean) }, { scaleX: 1 - 0.05 * flicker }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: w, height: h, transformOrigin: [w / 2, h, 0] }, style]}>
      <FlameShape w={w} h={h} />
    </Animated.View>
  );
}

type SmokeProps = {
  index: number;
  x: number;
  y: number;
  size: number;
  rise: number;
  elapsed: SharedValue<number>;
  timing: BreathTiming;
};

// A curl of smoke that rises from a candle after its flame goes out, until the end of the breath.
function Smoke({ index, x, y, size, rise, elapsed, timing }: SmokeProps) {
  const style = useAnimatedStyle(() => {
    const c = elapsed.value - Math.floor(elapsed.value);
    const outAt = timing.exhaleStart + (RELEASE[index] + OUT_TIME * 0.5) * (timing.exhaleEnd - timing.exhaleStart);
    if (c < outAt) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0.6 }] };
    const p = (c - outAt) / (1 - outAt);
    return {
      opacity: 0.75 * Math.sin(Math.PI * p),
      transform: [{ translateX: Math.sin(p * Math.PI * 2) * size * 0.4 }, { translateY: -p * rise }, { scale: 0.6 + 0.9 * p }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: x - size / 2, top: y - size * 0.3, width: size, height: size * 1.6 }, style]}>
      <Svg width={size} height={size * 1.6}>
        <Path
          d={`M${size / 2} ${size * 1.6} Q${size} ${size * 1.1} ${size / 2} ${size * 0.8} T${size / 2} 0`}
          stroke={candleColors.smoke}
          strokeWidth={size * 0.18}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

const FlameShape = memo(function FlameShape({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h}>
      <Path d={`M${w / 2} 0 Q${w} ${h * 0.62} ${w / 2} ${h} Q0 ${h * 0.62} ${w / 2} 0 Z`} fill={candleColors.flameOuter} />
      <Path d={`M${w / 2} ${h * 0.35} Q${w * 0.78} ${h * 0.75} ${w / 2} ${h} Q${w * 0.22} ${h * 0.75} ${w / 2} ${h * 0.35} Z`} fill={candleColors.flameInner} />
    </Svg>
  );
});

type CakeProps = {
  width: number;
  height: number;
  cx: number;
  cakeTop: number;
  CW: number;
  xs: number[];
  candleW: number;
  candleH: number;
  candleTop: number;
};

// Plate, cake with frosting drips and sprinkles, and striped candles with wicks.
const Cake = memo(function Cake({ width, height, cx, cakeTop, CW, xs, candleW, candleH, candleTop }: CakeProps) {
  const left = cx - CW / 2;
  const bodyH = CW * 0.36;
  const bottom = cakeTop + bodyH;
  const dripY = cakeTop + CW * 0.07;
  // Traced right to left, since the frosting outline comes back along the drips.
  const drips = Array.from({ length: 7 }, (_, k) => {
    const i = 6 - k;
    const x = left + CW * (0.07 + i * 0.143);
    const d = CW * (i % 2 ? 0.07 : 0.11);
    return `L${x + CW * 0.035} ${dripY} Q${x} ${dripY + d * 2} ${x - CW * 0.035} ${dripY}`;
  }).join(' ');
  const sprinkles = [
    [0.15, 0.55, '#FF6B6B'],
    [0.3, 0.72, '#4D96FF'],
    [0.46, 0.5, '#FFD93D'],
    [0.62, 0.7, '#6BCB77'],
    [0.78, 0.56, '#C77DFF'],
    [0.88, 0.78, '#FF6B6B'],
    [0.22, 0.85, '#FFD93D'],
    [0.55, 0.86, '#4D96FF'],
  ] as const;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Ellipse cx={cx} cy={bottom + CW * 0.02} rx={CW * 0.64} ry={CW * 0.07} fill={candleColors.plate} />
      <Rect x={left} y={cakeTop} width={CW} height={bodyH} rx={CW * 0.04} fill={candleColors.cake} />
      <Path d={`M${left} ${cakeTop + CW * 0.04} Q${left} ${cakeTop} ${left + CW * 0.04} ${cakeTop} L${left + CW - CW * 0.04} ${cakeTop} Q${left + CW} ${cakeTop} ${left + CW} ${cakeTop + CW * 0.04} L${left + CW} ${dripY} ${drips} L${left} ${dripY} Z`} fill={candleColors.frosting} />
      {sprinkles.map(([fx, fy, color], i) => (
        <Rect
          key={i}
          x={left + CW * fx}
          y={cakeTop + bodyH * fy}
          width={CW * 0.035}
          height={CW * 0.012}
          rx={CW * 0.006}
          fill={color}
          rotation={i % 2 ? 30 : -25}
          origin={`${left + CW * fx}, ${cakeTop + bodyH * fy}`}
        />
      ))}
      {xs.map((x, i) => (
        <Candle key={i} x={x} top={candleTop} w={candleW} h={candleH} color={candleColors.candles[i % candleColors.candles.length]} />
      ))}
    </Svg>
  );
});

function Candle({ x, top, w, h, color }: { x: number; top: number; w: number; h: number; color: string }) {
  return (
    <>
      <Rect x={x - w / 2} y={top} width={w} height={h} rx={w * 0.25} fill={color} />
      {[0.2, 0.45, 0.7].map((f) => (
        <Line key={f} x1={x - w / 2} y1={top + h * f + w * 0.5} x2={x + w / 2} y2={top + h * f} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={w * 0.28} />
      ))}
      <Line x1={x} y1={top} x2={x} y2={top - w * 0.6} stroke={candleColors.wick} strokeWidth={w * 0.18} strokeLinecap="round" />
    </>
  );
}

// Warm wall and a table.
const Room = memo(function Room({ width, height, tableTop }: { width: number; height: number; tableTop: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={candleColors.wallTop} />
          <Stop offset="1" stopColor={candleColors.wallBottom} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#wall)" />
      <Rect x={0} y={tableTop} width={width} height={height - tableTop} fill={candleColors.table} />
      <Rect x={0} y={tableTop} width={width} height={height * 0.012} fill={candleColors.tableEdge} />
      {[0.12, 0.85].map((f) => (
        <Circle key={f} cx={width * f} cy={tableTop + height * 0.08} r={width * 0.012} fill={candleColors.confetti} opacity={0.6} />
      ))}
    </Svg>
  );
});

// A string of party flags across the wall, drawn above the candle glow so it isn't tinted.
const Bunting = memo(function Bunting({ width, height }: { width: number; height: number }) {
  const sag = height * 0.04;
  const y0 = height * 0.22;
  const flags = 9;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Path d={`M0 ${y0} Q${width / 2} ${y0 + sag * 2} ${width} ${y0}`} stroke={candleColors.string} strokeWidth={2} fill="none" />
      {Array.from({ length: flags }, (_, i) => {
        const t = (i + 0.5) / flags;
        const x = width * t;
        const y = y0 + sag * 4 * t * (1 - t); // on the string's curve
        const s = width * 0.045;
        return (
          <Path
            key={i}
            d={`M${x - s} ${y} L${x + s} ${y} L${x} ${y + s * 1.6} Z`}
            fill={candleColors.bunting[i % candleColors.bunting.length]}
          />
        );
      })}
    </Svg>
  );
});
