# Sound System Documentation

## Overview
The ChildBreathing app now includes a comprehensive sound system that provides audio feedback during breathing exercises. The system supports both actual audio files and fallback tone generation.

## Features

### Sound Effects
- **Inhale Sound** - Plays during the inhale phase (4 seconds)
- **Exhale Sound** - Plays during the exhale phase (4 seconds)  
- **Hold Sound** - Plays during the breath hold phase (2 seconds)
- **Start Sound** - Plays when starting an exercise
- **Pause Sound** - Plays when pausing an exercise
- **Completion Sound** - Plays when an exercise is completed
- **Ambient Sound** - Background sound (optional)

### Audio Files
The system uses the following audio files from the assets folder:
- `inhale_sound_4seconds.wav` - Main inhale sound
- `exhale_sound_4seconds.wav` - Main exhale sound

## Implementation

### SoundManager Class
Located in `src/utils/soundManager.ts`, this singleton class manages all sound effects:

```typescript
const soundManager = SoundManager.getInstance();
soundManager.updateSettings(settings);
soundManager.playInhaleSound();
```

### Fallback System
Located in `src/utils/audioGenerator.ts`, provides basic tone generation when react-native-sound is not available.

### Integration
The sound system is integrated into:
- `ExerciseScreen.tsx` - Main breathing exercise interface
- `DandelionVisual.tsx` - Interactive dandelion visualization

## Settings
Sound can be controlled via the `AppSettings` interface:
- `soundEnabled: boolean` - Enable/disable all sounds
- `soundVolume: number` - Volume level (0.0 to 1.0)
- `vibrationEnabled: boolean` - Enable/disable vibration (future feature)

## Volume Levels
Base volume levels (multiplied by user volume setting):
- Inhale/Exhale: 0.6 × userVolume
- Hold: 0.3 × userVolume  
- Start/Pause: 0.5 × userVolume
- Completion: 0.7 × userVolume
- Ambient: 0.2 × userVolume

User can adjust volume from 0% to 100% via settings slider.

## Testing
Run the test scripts to verify sound system functionality:
```bash
# Test basic sound functionality
node test-sounds.js

# Test volume control
node test-volume.js
```

## Debugging
The system includes console logging to help debug sound loading and playback:
- Sound loading success/failure messages
- Sound playback confirmation messages
- Settings initialization logs

## Future Enhancements
- Custom sound file support
- Volume control per sound type
- Sound theme variations
- Background music integration
- Sound effects for achievements
