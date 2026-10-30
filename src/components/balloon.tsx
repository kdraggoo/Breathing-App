import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, Line, Path, Rect } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { WindStreak } from '@/components/wind-streak';
import { balloonColors } from '@/constants/theme';
import { breathAmount, type BreathTiming, journey } from '@/lib/breath';

/** Burner flame strength (0..1): on through the inhale, cut off quickly as the hold begins. */
function flameAmount(elapsed: number, t: BreathTiming) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  if (c < t.inhaleEnd) return Math.min(1, c / (t.inhaleEnd * 0.1));
  const after = (c - t.inhaleEnd) / Math.max(0.0001, t.exhaleStart - t.inhaleEnd);
  return c < t.exhaleStart ? Math.max(0, 1 - after * 4) : 0;
}

export function Balloon({ width, height, elapsed, timing, breaths = 0, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const E = Math.min(width * 0.36, height * 0.2, 150); // envelope width
  const r = E / 2;
  const BW = E * 1.2;
  const cx = BW / 2;
  const neckY = r * 2.05;
  const basketTop = neckY + E * 0.22;
  const basketH = E * 0.2;
  const BH = basketTop + basketH + 4;
  // Across a session it drifts from left to right; the home preview sits in the middle.
  const startX = breaths ? width * 0.3 : width * 0.5;
  const endX = width * 0.7;
  const baseY = height * 0.26;
  const rise = height * 0.1;

  const balloonStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return {
      transform: [
        { translateX: journey(elapsed.value, timing, breaths) * (endX - startX) },
        { translateY: -b * rise * (reduceMotion ? 0.3 : 1) },
      ],
    };
  });
  const envelopeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.88 + 0.14 * breathAmount(elapsed.value, timing) }],
  }));
  const flameStyle = useAnimatedStyle(() => {
    const f = flameAmount(elapsed.value, timing);
    const flicker = reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(elapsed.value * Math.PI * 60);
    return { opacity: f, transform: [{ scaleY: f * flicker }] };
  });
  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.2 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });

  if (width === 0 || height === 0) return null;

  const ringR = E * 0.85;
  const flameW = E * 0.19;
  const flameH = E * 0.2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SkyClouds width={width} height={height} />
      <Animated.View style={[{ position: 'absolute', left: startX - BW / 2, top: baseY, width: BW, height: BH }, balloonStyle]}>
        {showRing && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: cx - ringR,
                top: r - ringR,
                width: ringR * 2,
                height: ringR * 2,
                borderRadius: ringR,
                backgroundColor: '#FFFFFF',
              },
              ringStyle,
            ]}
          />
        )}
        {[0, 1, 2].map((i) => (
          <WindStreak
            key={i}
            index={i}
            count={3}
            left={cx - E * 1.25}
            top={r * 0.6 + i * E * 0.28}
            width={E * 0.55}
            angle={0}
            travel={E * 0.4}
            elapsed={elapsed}
            timing={timing}
          />
        ))}
        <Rigging BW={BW} BH={BH} E={E} neckY={neckY} basketTop={basketTop} basketH={basketH} />
        <Animated.View
          style={[
            { position: 'absolute', left: cx - flameW / 2, top: neckY + E * 0.02, width: flameW, height: flameH, transformOrigin: [flameW / 2, flameH, 0] },
            flameStyle,
          ]}
        >
          <Flame w={flameW} h={flameH} />
        </Animated.View>
        <Animated.View
          style={[{ position: 'absolute', left: 0, top: 0, width: BW, height: neckY + E * 0.06, transformOrigin: [cx, neckY, 0] }, envelopeStyle]}
        >
          <Envelope BW={BW} E={E} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Teardrop envelope with vertical gores: the same outline at three widths in alternating colors.
const Envelope = memo(function Envelope({ BW, E }: { BW: number; E: number }) {
  const cx = BW / 2;
  const r = E / 2;
  const shape = (sx: number) => {
    const rx = r * sx;
    return `M${cx - rx} ${r} A${rx} ${r} 0 0 1 ${cx + rx} ${r} Q${cx + rx} ${r * 1.6} ${cx + r * 0.28 * sx} ${r * 2.05} L${cx - r * 0.28 * sx} ${r * 2.05} Q${cx - rx} ${r * 1.6} ${cx - rx} ${r} Z`;
  };
  return (
    <Svg width={BW} height={r * 2.05 + E * 0.06}>
      <Path d={shape(1)} fill={balloonColors.outer} />
      <Path d={shape(0.62)} fill={balloonColors.middle} />
      <Path d={shape(0.24)} fill={balloonColors.inner} />
      <Ellipse cx={cx - r * 0.5} cy={r * 0.6} rx={r * 0.14} ry={r * 0.28} fill="#FFFFFF" opacity={0.35} rotation={20} origin={`${cx - r * 0.5}, ${r * 0.6}`} />
      <Rect x={cx - r * 0.3} y={r * 2.0} width={r * 0.6} height={E * 0.06} rx={E * 0.02} fill={balloonColors.band} />
    </Svg>
  );
});

type RiggingProps = { BW: number; BH: number; E: number; neckY: number; basketTop: number; basketH: number };

// Ropes from the neck down to a woven basket.
const Rigging = memo(function Rigging({ BW, BH, E, neckY, basketTop, basketH }: RiggingProps) {
  const cx = BW / 2;
  const bw = E * 0.32;
  return (
    <Svg style={StyleSheet.absoluteFill} width={BW} height={BH}>
      <Line x1={cx - E * 0.14} y1={neckY + E * 0.05} x2={cx - bw / 2 + 2} y2={basketTop} stroke={balloonColors.rope} strokeWidth={1.5} />
      <Line x1={cx + E * 0.14} y1={neckY + E * 0.05} x2={cx + bw / 2 - 2} y2={basketTop} stroke={balloonColors.rope} strokeWidth={1.5} />
      <Rect x={cx - bw / 2} y={basketTop} width={bw} height={basketH} rx={E * 0.03} fill={balloonColors.basket} />
      <Line x1={cx - bw / 2} y1={basketTop + basketH * 0.35} x2={cx + bw / 2} y2={basketTop + basketH * 0.35} stroke={balloonColors.weave} strokeWidth={1.5} />
      <Line x1={cx - bw / 2} y1={basketTop + basketH * 0.7} x2={cx + bw / 2} y2={basketTop + basketH * 0.7} stroke={balloonColors.weave} strokeWidth={1.5} />
    </Svg>
  );
});

const Flame = memo(function Flame({ w, h }: { w: number; h: number }) {
  // Drawn pointing up into the envelope from the burner below.
  return (
    <Svg width={w} height={h}>
      <Path d={`M${w / 2} 0 Q${w} ${h * 0.6} ${w / 2} ${h} Q0 ${h * 0.6} ${w / 2} 0 Z`} fill={balloonColors.flameOuter} />
      <Path d={`M${w / 2} ${h * 0.3} Q${w * 0.8} ${h * 0.7} ${w / 2} ${h} Q${w * 0.2} ${h * 0.7} ${w / 2} ${h * 0.3} Z`} fill={balloonColors.flameInner} />
    </Svg>
  );
});

// A couple of soft distant clouds for depth.
const SkyClouds = memo(function SkyClouds({ width, height }: { width: number; height: number }) {
  const puff = (x: number, y: number, s: number) => (
    <>
      <Ellipse cx={x} cy={y} rx={s * 1.4} ry={s * 0.45} fill="#FFFFFF" opacity={0.8} />
      <Ellipse cx={x - s * 0.4} cy={y - s * 0.25} rx={s * 0.55} ry={s * 0.45} fill="#FFFFFF" opacity={0.8} />
      <Ellipse cx={x + s * 0.35} cy={y - s * 0.32} rx={s * 0.65} ry={s * 0.5} fill="#FFFFFF" opacity={0.8} />
    </>
  );
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      {puff(width * 0.18, height * 0.62, width * 0.07)}
      {puff(width * 0.8, height * 0.68, width * 0.09)}
    </Svg>
  );
});
