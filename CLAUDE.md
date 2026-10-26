# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

A kids' breathing-exercise app, implemented **twice** with near-identical source:

- `ChildBreathingApp/` — bare React Native 0.81 CLI app (native `ios/` + `android/` projects, Jest, ESLint, Prettier). Uses `react-native-sound` for real audio.
- `ChildBreathingExpo/` — Expo SDK 54 port (no native folders, no test/lint tooling, no `react-native-sound`).
- The repo-root `package.json`/`tsconfig.json` are a stray Expo stub; real work happens inside one of the two app folders.

**Feature parity is intentional** (see `ChildBreathingExpo/EXPO_UPDATES.md`). `src/` in both apps is meant to stay in sync — when changing a screen, component, or util, apply the same change to the other app unless the change is platform-specific. Current known divergences: `SettingsScreen.tsx` (Expo defaults `soundVolume` to 0.6 when absent) and field ordering in `types/index.ts`.

Entry points differ: `ChildBreathingApp/App.tsx` re-exports `src/App.tsx`; the Expo app's root `App.tsx` defines the navigator itself (its `src/App.tsx` is unused) and uses `expo-status-bar`.

## Commands

Bare RN app (run from `ChildBreathingApp/`):

```bash
npm start                 # Metro
npm run ios               # requires `cd ios && pod install` first (Ruby/CocoaPods via Gemfile)
npm run android
npm run lint              # eslint (@react-native config)
npm test                  # jest, preset react-native
npx jest __tests__/App.test.tsx   # single test
npx react-native start --reset-cache
```

Expo app (run from `ChildBreathingExpo/`): `npm start`, `npm run ios`, `npm run android`, `npm run web`.

The `test-*.js` files in each app are ad-hoc manual scripts (`node test-volume.js`, etc.), not part of the Jest suite.

## Architecture

Stack navigator with three screens (`Home` → `Exercise` → `Settings`), headers hidden.

- **Exercise data** lives in `src/utils/exercises.ts` (`BREATHING_EXERCISES`, `getExerciseById`). Each exercise has a `visualType` (`balloon | flower | rainbow | star | dandelion`) that drives both the Home card emoji and the rendering branch in `ExerciseScreen`.
- **ExerciseScreen** runs the breathing loop with timers: a 10s cycle of inhale (4s) → hold (2s) → exhale (4s), plus a countdown timer for the exercise duration. Non-dandelion types render a simple animated shape via a `switch` on `visualType`.
- **Dandelion mode** (`visualType === 'dandelion'`) takes an early-return, full-screen path in `ExerciseScreen` with no UI chrome: it auto-starts, tap toggles start/pause, a hidden top-left area navigates back. It renders `components/DandelionVisual.tsx`.
- **DandelionStateManager** (`src/utils/dandelionStateManager.ts`, singleton) maps phase + progress to a `DandelionState`: inhale removes petals 40→0, hold freezes, exhale adds seeds 1→40. The head image is chosen from `Dandelion_Petals_<n>.png`, all statically `require`d in a lookup map (Metro needs static requires — keep it that way when adding frames). Floating petals/seeds are separate animated `Image`s spawned when counts change.
- **SoundManager** (`src/utils/soundManager.ts`, singleton) `try`-requires `react-native-sound` and loads `inhale_sound_4seconds.wav`/`exhale_sound_4seconds.wav` from `MAIN_BUNDLE` (they must be bundled into the native projects). If the module is missing (as in Expo) it falls back to `audioGenerator.ts`, which only works where Web Audio exists, so it's effectively silent on device. Each sound type has a base volume multiplied by the user's `soundVolume` — see `SOUND_SYSTEM.md`.
- **Settings** persist as JSON under the AsyncStorage key `appSettings` (`AppSettings` in `src/types`). `SettingsScreen` writes it, and `ExerciseScreen` reads it on mount and pushes it into `SoundManager.updateSettings()`. There is no global state/context; the screens share settings only through AsyncStorage.

## Known gaps

- `ChildBreathingApp/assets/` currently has only `Dandelion_Petals_0` and `37`–`40`, but `dandelionStateManager.ts` requires frames 1–40, so bundling fails until the missing frames are added. The full set is in `ChildBreathingExpo/assets/`, and source layers are in `assets/dandelion_layers_package/`.
- README features such as progress tracking, achievements, themes, and Reanimated aren't implemented and aren't installed; `UserProgress`/`ExerciseSession` types exist but are unused.
