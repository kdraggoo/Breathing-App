import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Dandelion } from '@/components/dandelion';
import { Sky } from '@/components/sky';
import { colors } from '@/constants/theme';

const STILL = { inhaleEnd: 0.4, exhaleStart: 0.5, exhaleEnd: 1 };

export default function Home() {
  const { width, height } = useWindowDimensions();
  const elapsed = useSharedValue(0);
  const fresh = useSharedValue(1);

  return (
    <View style={styles.root}>
      <Sky />
      <Dandelion width={width} height={height} elapsed={elapsed} fresh={fresh} timing={STILL} showRing={false} />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.top}>
          <Link href="/settings" asChild>
            <Pressable style={styles.grownUps} accessibilityRole="button" accessibilityLabel="Settings for grown-ups" hitSlop={12}>
              <Text style={styles.grownUpsText}>Grown-ups</Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title} accessibilityRole="header">
            Dandelion Breaths
          </Text>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.subtitle}>Breathe in slowly, then blow the seeds away.</Text>
          <Pressable
            style={({ pressed }) => [styles.start, pressed && styles.pressed]}
            onPress={() => router.push('/breathe')}
            accessibilityRole="button"
            accessibilityLabel="Start breathing"
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
