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
    if (i === index) return;
    setIndex(i);
    updateSettings({ scene: SCENES[i].id });
  };

  // Pages are [last scene, ...scenes, first scene]. Landing on either copy jumps to the
  // real page without animation, so swiping past either end wraps around seamlessly.
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    const i = (page - 1 + SCENES.length) % SCENES.length;
    if (page === 0 || page === SCENES.length + 1) {
      scroller.current?.scrollTo({ x: (i + 1) * width, animated: false });
    }
    select(i);
  };

  // For VoiceOver/TalkBack, which adjust the pager instead of swiping it.
  const step = (delta: number) => {
    const i = (index + delta + SCENES.length) % SCENES.length;
    scroller.current?.scrollTo({ x: (i + 1) * width, animated: false });
    select(i);
  };

  const pages = [SCENES[SCENES.length - 1], ...SCENES, SCENES[0]];

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        // Open on the last scene used, on both platforms.
        onLayout={() => scroller.current?.scrollTo({ x: (index + 1) * width, animated: false })}
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Scene"
        accessibilityValue={{ text: scene.name }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        {pages.map((s, page) => (
          <View key={page} style={{ width, height, overflow: 'hidden' }}>
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
