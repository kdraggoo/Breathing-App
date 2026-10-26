import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';

type Cue = 'inhale' | 'exhale' | 'done';

/** Sound + haptic cues for a breathing session, honoring the user's settings. */
export function useBreathCues({ sound, haptics }: { sound: boolean; haptics: boolean }) {
  const inhale = useAudioPlayer(require('../../assets/sounds/inhale.wav'));
  const exhale = useAudioPlayer(require('../../assets/sounds/exhale.wav'));
  const done = useAudioPlayer(require('../../assets/sounds/done.wav'));

  useEffect(() => {
    // Respect the iOS silent switch; this is a calm app, not an alarm.
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  }, []);

  return useMemo(() => {
    const players = { inhale, exhale, done };
    return {
      cue(name: Cue) {
        if (sound) {
          // A short exhale setting can end before the wind sound does; cut it off at the next inhale.
          if (name === 'inhale') exhale.pause();
          const player = players[name];
          player.seekTo(0);
          player.play();
        }
        if (haptics) {
          const result =
            name === 'done'
              ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              : Haptics.impactAsync(name === 'inhale' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light);
          result.catch(() => {});
        }
      },
      silence() {
        Object.values(players).forEach((p) => p.pause());
      },
    };
  }, [sound, haptics, inhale, exhale, done]);
}
