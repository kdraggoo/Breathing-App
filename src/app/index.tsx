import { Link, router } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sky } from '@/components/sky';
import { colors } from '@/constants/theme';
import { SCENES } from '@/lib/scenes';
import { updateSettings, useSettings } from '@/lib/settings';

const STILL = { inhaleEnd: 0.4, exhaleStart: 0.5, exhaleEnd: 1 };

export default function Home() {
  const { width, height } = useWindowDimensions();
  const settings = useSettings();
  const [index, setIndex] = useState(() => Math.max(0, SCENES.findIndex((s) => s.id === settings.scene)));
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  // Scene previews are frozen at the start of a breath.
  const elapsed = useSharedValue(0);
  const fresh = useSharedValue(1);
  const scene = SCENES[index];

  const select = (i: number) => {
    setIndex(i);
    updateSettings({ scene: SCENES[i].id });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SCENES.length) select(i);
  };

  const jumpTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    select(i);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        // Open on the last scene used, on both platforms.
        onLayout={() => scroller.current?.scrollTo({ x: index * width, animated: false })}
        style={StyleSheet.absoluteFill}
      >
        {SCENES.map((s) => (
          <View key={s.id} style={{ width, height, overflow: 'hidden' }}>
            <Sky />
            <s.Visual width={width} height={height} elapsed={elapsed} fresh={fresh} timing={STILL} showRing={false} />
          </View>
        ))}
      </ScrollView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="box-none">
          <Link href="/settings" asChild>
            <Pressable style={styles.grownUps} accessibilityRole="button" accessibilityLabel="Settings for grown-ups" hitSlop={12}>
              <Text style={styles.grownUpsText}>Grown-ups</Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.titleBlock} pointerEvents="none">
          <Text style={styles.title} accessibilityRole="header">
            Dandelion Breaths
          </Text>
        </View>
        <View style={styles.bottom} pointerEvents="box-none">
          <Text style={styles.subtitle} pointerEvents="none">
            {scene.tagline}
          </Text>
          <View style={styles.dots} accessibilityRole="tablist">
            {SCENES.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => jumpTo(i)}
                hitSlop={10}
                accessibilityRole="tab"
                accessibilityLabel={s.name}
                accessibilityState={{ selected: i === index }}
              >
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.start, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/breathe', params: { scene: scene.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Start breathing with ${scene.name}`}
          >
            <Text style={styles.startText}>Let&apos;s breathe</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, paddingHorizontal: 24 },
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  grownUps: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.card },
  grownUpsText: { color: colors.inkSoft, fontSize: 15, fontWeight: '600' },
  titleBlock: { marginTop: 8, alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  bottom: { marginTop: 'auto', alignItems: 'center', gap: 16, paddingBottom: 24 },
  subtitle: {
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dots: { flexDirection: 'row', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.dotEmpty },
  dotActive: { backgroundColor: colors.dotFull, transform: [{ scale: 1.3 }] },
  start: {
    backgroundColor: colors.button,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 32,
    minWidth: 240,
    alignItems: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  startText: { color: colors.buttonText, fontSize: 22, fontWeight: '800' },
});
