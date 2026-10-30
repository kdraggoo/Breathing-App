# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `AGENTS.md` first: it covers Expo SDK conventions (fetch versioned docs before touching Expo APIs, use `npx expo install`, never hand-edit generated `ios/`/`android/`).

## Project

"Dandelion Breaths": a kids' breathing app targeting the iOS App Store and Google Play. It's an Expo SDK 58 app with Expo Router and Continuous Native Generation, built and submitted with EAS. v1 has a single exercise: breathe in, then blow the dandelion's seeds away. The prototypes this replaced (a bare RN app and an older Expo app) live on the `archive/v0` branch for reference only.

## Commands

```bash
npx expo start              # dev server; press i / a for simulator / emulator
npx tsc --noEmit            # typecheck
npx expo lint               # lint
npx expo-doctor             # dependency/config health
node scripts/generate-sounds.mjs   # regenerate assets/sounds/*.wav
python3 scripts/generate-icons.py  # regenerate app icon, Android icon layers, splash, favicon (needs Pillow)
npx eas-cli@latest build --profile development|preview|production --platform ios|android
npx eas-cli@latest submit --platform ios|android
```

There is no test suite yet.

## Architecture

- **Routes** (`src/app/`): `index` (home: a horizontal paging `ScrollView` with one page per scene, remembering the last one in settings), `breathe?scene=<id>` (session, full screen, swipe-back disabled), `settings` (modal labeled "For grown-ups").
- **Scenes** (`src/lib/scenes.ts`): each scene is an id, a name, the home tagline, per-phase hint overrides, a done message, and a `Visual` component taking `SceneVisualProps` (`src/components/scene-types.ts`). Current scenes are `dandelion` and `clouds` (blow clouds away to reveal the sun, `src/components/clouds.tsx`). To add one, write the visual, add its id to `SCENE_IDS` in `src/constants/theme.ts`, and add an entry to `SCENES`.
- **One clock drives everything.** In `breathe.tsx`, a single Reanimated shared value `elapsed` animates linearly from 0 to the number of breaths in the session. Its integer part is the breath index and its fraction is the position within the breath. `src/lib/breath.ts` maps that to four phases (inhale, hold, exhale, holdOut) using `inhaleEnd`/`exhaleStart`/`exhaleEnd` fractions. `phaseStep()` gives a monotonically increasing step (`breath*4 + phase`). A `useAnimatedReaction` sends each new step to JS with `scheduleOnRN` (react-native-worklets), and JS fires the sounds, haptics, prompts and screen-reader announcements. Pause calls `cancelAnimation`; resume re-animates from the current value on the UI thread with `scheduleOnUI`. "Again" resets `elapsed` to 0, which the reaction ignores because the step goes backwards.
- **React Compiler + worklets:** the React Compiler is on, and it hoists inline arrow functions out of `useAnimatedStyle`/worklet callbacks into plain module functions (`_temp`). Calling one on the UI thread aborts the app ("Tried to synchronously call a Remote Function"). Put helpers used in animation code in module-level functions with a `'worklet'` directive (e.g. `easeInOut` in `src/lib/breath.ts`).
- **Dandelion** (`src/components/dandelion.tsx`): an SVG stem with 52 seeds. Each seed is an `Animated.View` wrapping a static SVG, and each worklet style reads `elapsed`. Seeds regrow early in the inhale and release at staggered thresholds during the exhale, then drift with the wind. All are gone by `exhaleEnd`, so the head stays bare through holdOut. The `fresh` shared value keeps the head full during the very first inhale. The home screen reuses the same component, frozen at `elapsed = 0`. With reduced motion on, seeds fade in place instead of flying.
- **Settings** (`src/lib/settings.ts`): a module-level store persisted with `expo-sqlite/kv-store` (sync API) and exposed through `useSyncExternalStore`. Phase durations are stored as whole seconds and clamped to `PHASE_LIMITS` when loaded (either hold may be 0, which skips that phase). `breathe.tsx` snapshots the durations and breath count when it mounts.
- **Cues** (`src/lib/feedback.ts`): `expo-audio` players for the three WAVs plus `expo-haptics`, gated by settings. `playsInSilentMode: false` is deliberate.
- **Sounds are synthesized** by `scripts/generate-sounds.mjs` (seeded and deterministic). No third-party audio, so there are no licensing questions.

## Store and kids-category constraints

- Keep the app free of ads, analytics, tracking SDKs and any network calls. Apple's Kids Category and Google's Families policy both penalize these. Any external link or purchase needs a parental gate.
- The `expo-audio` plugin is configured with `microphonePermission: false`, `recordAudioAndroid: false` and `enableBackgroundPlayback: false`. This keeps the mic permission and the Android foreground-service declaration out of the binaries. Don't remove these.
- The bundle ID and package name are `com.draggoo.childbreathing`. They can't be changed once a build is published.
- `eas.json` uses remote app versioning (`autoIncrement` on production).
