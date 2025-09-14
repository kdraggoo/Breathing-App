import { AppSettings } from '../types';
import { FallbackSoundManager } from './audioGenerator';

// Try to import react-native-sound, fallback to audio generator if not available
let Sound: any = null;
try {
  Sound = require('react-native-sound').default;
  if (Sound) {
    Sound.setCategory('Playback');
  }
} catch (error) {
  console.log('react-native-sound not available, using fallback audio generator');
}

class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: any } = {};
  private settings: AppSettings | null = null;
  private isEnabled: boolean = true;
  private fallbackManager: FallbackSoundManager;

  private constructor() {
    this.fallbackManager = new FallbackSoundManager();
    if (Sound) {
      this.initializeSounds();
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public updateSettings(settings: AppSettings): void {
    this.settings = settings;
    this.isEnabled = settings.soundEnabled;
  }

  private initializeSounds(): void {
    if (!Sound) return;

    // Initialize actual sound files from assets
    // Breathing phase sounds
    this.sounds.inhale = new Sound('inhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load inhale sound', error);
      } else {
        console.log('Inhale sound loaded successfully');
      }
    });

    this.sounds.exhale = new Sound('exhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load exhale sound', error);
      } else {
        console.log('Exhale sound loaded successfully');
      }
    });

    // For hold phase, we'll use a shorter version of inhale sound
    this.sounds.hold = new Sound('inhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load hold sound', error);
      } else {
        console.log('Hold sound loaded successfully');
      }
    });

    // Exercise completion sound - using exhale sound for now
    this.sounds.completion = new Sound('exhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load completion sound', error);
      } else {
        console.log('Completion sound loaded successfully');
      }
    });

    // Start/stop exercise sounds - using inhale for start, exhale for pause
    this.sounds.start = new Sound('inhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load start sound', error);
      } else {
        console.log('Start sound loaded successfully');
      }
    });

    this.sounds.pause = new Sound('exhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load pause sound', error);
      } else {
        console.log('Pause sound loaded successfully');
      }
    });

    // Background ambient sound - using inhale sound for ambient
    this.sounds.ambient = new Sound('inhale_sound_4seconds.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load ambient sound', error);
      } else {
        console.log('Ambient sound loaded successfully');
      }
    });
  }

  public playInhaleSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.inhale) {
      this.sounds.inhale.setVolume(0.6);
      this.sounds.inhale.play();
    } else {
      this.fallbackManager.playInhaleSound();
    }
  }

  public playExhaleSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.exhale) {
      this.sounds.exhale.setVolume(0.6);
      this.sounds.exhale.play();
    } else {
      this.fallbackManager.playExhaleSound();
    }
  }

  public playHoldSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.hold) {
      this.sounds.hold.setVolume(0.3);
      this.sounds.hold.play();
    } else {
      this.fallbackManager.playHoldSound();
    }
  }

  public playCompletionSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.completion) {
      this.sounds.completion.setVolume(0.7);
      this.sounds.completion.play();
    } else {
      this.fallbackManager.playCompletionSound();
    }
  }

  public playStartSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.start) {
      this.sounds.start.setVolume(0.5);
      this.sounds.start.play();
    } else {
      this.fallbackManager.playStartSound();
    }
  }

  public playPauseSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.pause) {
      this.sounds.pause.setVolume(0.5);
      this.sounds.pause.play();
    } else {
      this.fallbackManager.playPauseSound();
    }
  }

  public playAmbientSound(): void {
    if (!this.isEnabled) return;
    
    if (Sound && this.sounds.ambient) {
      this.sounds.ambient.setVolume(0.2);
      this.sounds.ambient.setNumberOfLoops(-1); // Loop indefinitely
      this.sounds.ambient.play();
    } else {
      this.fallbackManager.playAmbientSound();
    }
  }

  public stopAmbientSound(): void {
    if (Sound && this.sounds.ambient) {
      this.sounds.ambient.stop();
    } else {
      this.fallbackManager.stopAmbientSound();
    }
  }

  public stopAllSounds(): void {
    if (Sound) {
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.stop();
        }
      });
    } else {
      this.fallbackManager.stopAllSounds();
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public cleanup(): void {
    this.stopAllSounds();
    if (Sound) {
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.release();
        }
      });
    }
    this.sounds = {};
  }
}

export default SoundManager;
