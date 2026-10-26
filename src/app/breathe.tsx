import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { Dandelion } from '@/components/dandelion';
import { Sky } from '@/components/sky';
import { colors, PACES } from '@/constants/theme';
import { breathTiming, type Phase, PHASES, phaseStep } from '@/lib/breath';
import { useBreathCues } from '@/lib/feedback';
import { useSettings } from '@/lib/settings';

type Status = 'ready' | 'running' | 'paused' | 'done';

const PROMPTS: Record<Phase, { title: string; hint: string }> = {
  inhale: { title: 'Breathe in', hint: 'Slowly, through your nose' },
  hold: { title: 'Hold', hint: 'Just for a moment' },
  exhale: { title: 'Blow out', hint: 'Blow the seeds away' },
};

const READY_DELAY_MS = 1800;

export default function Breathe() {
  const { width, height } = useWindowDimensions();
  const settings = useSettings();
  // Fixed for the life of the screen so timing can't shift mid-session.
  const [session] = useState(() => ({ breaths: settings.breaths, ...breathTiming(PACES[settings.pace]) }));
  const cues = useBreathCues(settings);
  const reduceMotion = useReducedMotion();

  const elapsed = useSharedValue(0);
  const fresh = useSharedValue(1);
  const [status, setStatus] = useState<Status>('ready');
  const [phase, setPhase] = useState<Phase>('inhale');
  const [breath, setBreath] = useState(0);

  // Animate from wherever `elapsed` is (or `from`) to the end of the session.
  const play = useCallback(
    (from?: number) => {
      const { breaths, total } = session;
      scheduleOnUI(() => {
        'worklet';
        if (from !== undefined) elapsed.value = from;
        elapsed.value = withTiming(breaths, { duration: (breaths - elapsed.value) * total, easing: Easing.linear });
      });
    },
    [session, elapsed],
  );

  const begin = useCallback(() => {
    setBreath(0);
    setPhase('inhale');
    setStatus('running');
    cues.cue('inhale');
    AccessibilityInfo.announceForAccessibility(PROMPTS.inhale.title);
    play(0);
  }, [cues, play]);

  const pause = useCallback(() => {
    cancelAnimation(elapsed);
    cues.silence();
    setStatus('paused');
  }, [elapsed, cues]);

  const resume = useCallback(() => {
    setStatus('running');
    play();
  }, [play]);

  const onStep = useCallback(
    (step: number) => {
      const b = Math.floor(step / 3);
      setBreath(b);
      if (b >= session.breaths) {
        setStatus('done');
        cues.cue('done');
        AccessibilityInfo.announceForAccessibility('All done. Great breathing!');
        return;
      }
      const p = PHASES[step % 3];
      setPhase(p);
      if (p !== 'hold') cues.cue(p);
      AccessibilityInfo.announceForAccessibility(PROMPTS[p].title);
    },
    [session, cues],
  );

  useAnimatedReaction(
    () => phaseStep(elapsed.value, session.inhaleEnd, session.exhaleStart),
    (step, prev) => {
      // Only forward progress counts; resetting for "again" moves backwards and is ignored.
      if (prev === null || step <= prev) return;
      if (step % 3 === 2) fresh.value = 0;
      scheduleOnRN(onStep, step);
    },
  );

  // Short settle-in before the first breath.
  useEffect(() => {
    if (status !== 'ready') return;
    const t = setTimeout(begin, READY_DELAY_MS);
    return () => clearTimeout(t);
  }, [status, begin]);

  // Pause when the app leaves the foreground.
  useEffect(() => {
    if (status !== 'running') return;
    const sub = AppState.addEventListener('change', (s) => s !== 'active' && pause());
    return () => sub.remove();
  }, [status, pause]);

  useEffect(() => () => cancelAnimation(elapsed), [elapsed]);

  const onScreenPress = () => {
    if (status === 'running') pause();
    else if (status === 'paused') resume();
  };

  const prompt =
    status === 'ready'
      ? { title: 'Get comfy', hint: 'Sit tall and relax your shoulders' }
      : status === 'paused'
        ? { title: 'Paused', hint: 'Tap anywhere to keep going' }
        : status === 'done'
          ? null
          : PROMPTS[phase];

  return (
    <View style={styles.root}>
      <Sky />
      <Dandelion
        width={width}
        height={height}
        elapsed={elapsed}
        fresh={fresh}
        timing={session}
        reduceMotion={reduceMotion}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onScreenPress}
        disabled={status === 'ready' || status === 'done'}
        accessibilityRole="button"
        accessibilityLabel={status === 'paused' ? 'Keep going' : 'Pause'}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.top}>
            <Pressable
              onPress={() => router.back()}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Stop and go home"
              hitSlop={12}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <View
              style={styles.dots}
              accessible
              accessibilityLabel={`Breath ${Math.min(breath + 1, session.breaths)} of ${session.breaths}`}
            >
              {Array.from({ length: session.breaths }, (_, i) => (
                <View key={i} style={[styles.dot, i < breath && styles.dotFull]} />
              ))}
            </View>
            <View style={styles.close} />
          </View>

          {status === 'done' && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
              <View style={[styles.card, styles.doneCard]}>
                <Text style={styles.doneTitle}>You did it!</Text>
                <Text style={styles.hint}>
                  You blew away {session.breaths} dandelions.{'\n'}How does your body feel?
                </Text>
                <View style={styles.doneButtons}>
                  <Pressable style={[styles.button, styles.secondary]} onPress={() => router.back()} accessibilityRole="button">
                    <Text style={[styles.buttonText, styles.secondaryText]}>Home</Text>
                  </Pressable>
                  <Pressable style={styles.button} onPress={begin} accessibilityRole="button">
                    <Text style={styles.buttonText}>Again</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {prompt && (
            <View style={styles.bottom}>
              <Animated.View key={`${status}-${phase}`} entering={FadeIn.duration(350)} style={styles.card}>
                <Text style={styles.title}>{prompt.title}</Text>
                <Text style={styles.hint}>{prompt.hint}</Text>
              </Animated.View>
            </View>
          )}
        </SafeAreaView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22, color: colors.ink, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 8, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.dotEmpty },
  dotFull: { backgroundColor: colors.dotFull },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bottom: { marginTop: 'auto', alignItems: 'center', paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 240,
    gap: 4,
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.ink },
  hint: { fontSize: 18, color: colors.inkSoft, textAlign: 'center', lineHeight: 25 },
  doneCard: { gap: 10, paddingVertical: 28 },
  doneTitle: { fontSize: 36, fontWeight: '800', color: colors.ink },
  doneButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    backgroundColor: colors.button,
    borderWidth: 2,
    borderColor: colors.button,
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: { color: colors.buttonText, fontSize: 19, fontWeight: '800' },
  secondary: { backgroundColor: '#FFFFFF' },
  secondaryText: { color: colors.button },
});
