import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '@/constants/theme';

/** Full-screen sky gradient with a rolling hill along the bottom. */
export function Sky() {
  const { width, height } = useWindowDimensions();
  const hillTop = height * 0.86;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.skyTop} />
          <Stop offset="1" stopColor={colors.skyBottom} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#sky)" />
      <Path
        d={`M0 ${hillTop + 30} Q${width * 0.35} ${hillTop - 40} ${width} ${hillTop + 10} L${width} ${height} L0 ${height} Z`}
        fill={colors.hillShade}
      />
      <Path
        d={`M0 ${hillTop + 50} Q${width * 0.6} ${hillTop - 10} ${width} ${hillTop + 60} L${width} ${height} L0 ${height} Z`}
        fill={colors.hill}
      />
    </Svg>
  );
}
