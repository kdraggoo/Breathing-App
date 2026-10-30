import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Line, Path, Rect, Stop } from 'react-native-svg';

import type { SceneVisualProps } from '@/components/scene-types';
import { WindStreak } from '@/components/wind-streak';
import { sailColors } from '@/constants/theme';
import { breathAmount, type BreathTiming, easeInOut, journey } from '@/lib/breath';

/** Relative boat speed (0..1) at `elapsed`, for the wake. */
function speed(elapsed: number, t: BreathTiming, breaths: number) {
  'worklet';
  if (!breaths || elapsed >= breaths) return 0;
  const c = elapsed - Math.floor(elapsed);
  return c < t.exhaleStart ? 0 : Math.sin((Math.PI * (c - t.exhaleStart)) / (1 - t.exhaleStart));
}

/** How full the sail is (0..1): it fills quickly when blowing starts and relaxes during the hold after. */
function sailFill(elapsed: number, t: BreathTiming) {
  'worklet';
  const c = elapsed - Math.floor(elapsed);
  if (c >= t.exhaleStart && c < t.exhaleEnd) return Math.min(1, (c - t.exhaleStart) / ((t.exhaleEnd - t.exhaleStart) * 0.2));
  if (c >= t.exhaleEnd) return 1 - easeInOut((c - t.exhaleEnd) / (1 - t.exhaleEnd));
  return 0;
}

export function Sailboat({ width, height, elapsed, timing, breaths = 0, reduceMotion = false, showRing = true }: SceneVisualProps) {
  const B = Math.min(width * 0.3, height * 0.15, 130); // hull length
  const horizon = height * 0.5;
  const waterline = height * 0.62;
  const islandX = width * 0.88;
  const islandRx = width * 0.13;
  const startX = B * 0.75;
  const endX = Math.max(startX, islandX - islandRx - B * 0.45);

  // Boat container, with the hull's waterline at `yW` inside it.
  const BW = B * 1.3;
  const BH = B * 1.3;
  const yW = BH - B * 0.12;
  const deck = yW - B * 0.16;
  const mastX = BW / 2 - B * 0.05;
  const sailW = B * 0.48;
  const sailH = B * 0.82;

  const boatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: journey(elapsed.value, timing, breaths) * (endX - startX) },
      { translateY: reduceMotion ? 0 : Math.sin(elapsed.value * Math.PI * 2) * B * 0.03 },
    ],
  }));
  const sailStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 0.35 + 0.65 * sailFill(elapsed.value, timing) }],
  }));
  const ringStyle = useAnimatedStyle(() => {
    const b = breathAmount(elapsed.value, timing);
    return { opacity: 0.2 + 0.2 * b, transform: [{ scale: 0.72 + 0.3 * b }] };
  });

  if (width === 0 || height === 0) return null;

  const ringR = B * 0.75;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Lake width={width} height={height} horizon={horizon} waterline={waterline} islandX={islandX} islandRx={islandRx} B={B} />
      <Animated.View style={[{ position: 'absolute', left: startX - BW / 2, top: waterline - yW, width: BW, height: BH }, boatStyle]}>
        {showRing && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: mastX + sailW * 0.4 - ringR,
                top: deck - sailH * 0.5 - ringR,
                width: ringR * 2,
                height: ringR * 2,
                borderRadius: ringR,
                backgroundColor: '#FFFFFF',
              },
              ringStyle,
            ]}
          />
        )}
        {[0, 1].map((i) => (
          <Wake key={i} index={i} x={BW / 2 - B * 0.62 - i * B * 0.2} y={yW - 4} w={B * 0.22} elapsed={elapsed} timing={timing} breaths={breaths} />
        ))}
        {[0, 1, 2].map((i) => (
          <WindStreak
            key={i}
            index={i}
            count={3}
            left={mastX - B * 0.95}
            top={deck - sailH * 0.85 + i * B * 0.22}
            width={B * 0.6}
            angle={0}
            travel={B * 0.45}
            elapsed={elapsed}
            timing={timing}
          />
        ))}
        <Animated.View
          style={[{ position: 'absolute', left: mastX, top: deck - sailH, width: sailW, height: sailH, transformOrigin: [0, sailH / 2, 0] }, sailStyle]}
        >
          <Sail w={sailW} h={sailH} />
        </Animated.View>
        <Hull BW={BW} BH={BH} B={B} yW={yW} deck={deck} mastX={mastX} sailH={sailH} />
      </Animated.View>
    </View>
  );
}

type WakeProps = {
  index: number;
  x: number;
  y: number;
  w: number;
  elapsed: SharedValue<number>;
  timing: BreathTiming;
  breaths: number;
};

// A ripple trailing behind the stern, visible while the boat is moving.
function Wake({ index, x, y, w, elapsed, timing, breaths }: WakeProps) {
  const style = useAnimatedStyle(() => ({
    opacity: speed(elapsed.value, timing, breaths) * (0.9 - index * 0.35),
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y - 6, width: w, height: 10 }, style]}>
      <Svg width={w} height={10}>
        <Path d={`M1 8 Q${w / 2} 0 ${w - 1} 8`} stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

// The mainsail, drawn from the mast (left edge) with a bellied leading edge.
const Sail = memo(function Sail({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h}>
      <Path d={`M1 0 L1 ${h} L${w} ${h} Q${w * 0.62} ${h * 0.38} 1 0 Z`} fill={sailColors.sail} stroke={sailColors.sailEdge} strokeWidth={1.5} />
      <Path d={`M1 ${h * 0.62} L${w * 0.72} ${h * 0.62}`} stroke={sailColors.stripe} strokeWidth={h * 0.06} />
    </Svg>
  );
});

type HullProps = { BW: number; BH: number; B: number; yW: number; deck: number; mastX: number; sailH: number };

const Hull = memo(function Hull({ BW, BH, B, yW, deck, mastX, sailH }: HullProps) {
  const cx = BW / 2;
  const keel = yW + B * 0.06;
  const top = deck - sailH - B * 0.08;
  return (
    <Svg style={StyleSheet.absoluteFill} width={BW} height={BH}>
      <Line x1={mastX} y1={deck} x2={mastX} y2={top} stroke={sailColors.mast} strokeWidth={B * 0.04} strokeLinecap="round" />
      <Path d={`M${mastX} ${top} L${mastX + B * 0.2} ${top + B * 0.06} L${mastX} ${top + B * 0.12} Z`} fill={sailColors.flag} />
      <Path
        d={`M${cx - B * 0.5} ${deck} L${cx + B * 0.5} ${deck} L${cx + B * 0.3} ${keel} L${cx - B * 0.38} ${keel} Z`}
        fill={sailColors.hull}
      />
      <Path d={`M${cx - B * 0.46} ${deck + B * 0.05} L${cx + B * 0.46} ${deck + B * 0.05}`} stroke="#FFFFFF" strokeWidth={B * 0.03} />
    </Svg>
  );
});

type LakeProps = { width: number; height: number; horizon: number; waterline: number; islandX: number; islandRx: number; B: number };

// Far shore, water, sparkles and the island with a palm tree the boat sails toward.
const Lake = memo(function Lake({ width, height, horizon, waterline, islandX, islandRx, B }: LakeProps) {
  const sparkles = [
    [0.12, 0.08],
    [0.35, 0.2],
    [0.6, 0.05],
    [0.25, 0.32],
    [0.7, 0.26],
    [0.5, 0.4],
  ];
  const trunkTop = { x: islandX - B * 0.12, y: waterline - B * 0.8 };
  const leaf = (dx: number, dy: number) =>
    `M${trunkTop.x} ${trunkTop.y} Q${trunkTop.x + dx * 0.6} ${trunkTop.y + dy - B * 0.18} ${trunkTop.x + dx} ${trunkTop.y + dy}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sailColors.waterTop} />
          <Stop offset="1" stopColor={sailColors.waterBottom} />
        </LinearGradient>
      </Defs>
      <Path
        d={`M0 ${horizon} Q${width * 0.2} ${horizon - height * 0.05} ${width * 0.45} ${horizon - height * 0.015} Q${width * 0.75} ${horizon - height * 0.06} ${width} ${horizon - height * 0.01} L${width} ${horizon} Z`}
        fill={sailColors.shore}
      />
      <Rect x={0} y={horizon} width={width} height={height - horizon} fill="url(#water)" />
      {sparkles.map(([fx, fy], i) => (
        <Line
          key={i}
          x1={width * fx}
          y1={horizon + (height - horizon) * fy}
          x2={width * fx + B * 0.25}
          y2={horizon + (height - horizon) * fy}
          stroke="#FFFFFF"
          strokeOpacity={0.45}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      <Ellipse cx={islandX} cy={waterline + B * 0.02} rx={islandRx} ry={B * 0.13} fill={sailColors.sand} />
      <Path
        d={`M${islandX} ${waterline - B * 0.02} Q${islandX + B * 0.02} ${waterline - B * 0.45} ${trunkTop.x} ${trunkTop.y}`}
        stroke={sailColors.trunk}
        strokeWidth={B * 0.07}
        strokeLinecap="round"
        fill="none"
      />
      {[
        [-B * 0.45, B * 0.2],
        [-B * 0.3, -B * 0.05],
        [B * 0.4, B * 0.18],
        [B * 0.3, -B * 0.06],
      ].map(([dx, dy], i) => (
        <Path key={i} d={leaf(dx, dy)} stroke={sailColors.palm} strokeWidth={B * 0.09} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
});
