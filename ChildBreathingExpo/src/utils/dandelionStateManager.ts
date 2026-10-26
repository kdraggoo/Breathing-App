import { DandelionState } from '../types';

// Pre-load all petal and seed images to avoid dynamic requires
const PETAL_IMAGES = {
  1: require('../../assets/Dandelion_Petals_1.png'),
  2: require('../../assets/Dandelion_Petals_2.png'),
  3: require('../../assets/Dandelion_Petals_3.png'),
  4: require('../../assets/Dandelion_Petals_4.png'),
  5: require('../../assets/Dandelion_Petals_5.png'),
  6: require('../../assets/Dandelion_Petals_6.png'),
  7: require('../../assets/Dandelion_Petals_7.png'),
  8: require('../../assets/Dandelion_Petals_8.png'),
  9: require('../../assets/Dandelion_Petals_9.png'),
  10: require('../../assets/Dandelion_Petals_10.png'),
  11: require('../../assets/Dandelion_Petals_11.png'),
  12: require('../../assets/Dandelion_Petals_12.png'),
  13: require('../../assets/Dandelion_Petals_13.png'),
  14: require('../../assets/Dandelion_Petals_14.png'),
  15: require('../../assets/Dandelion_Petals_15.png'),
  16: require('../../assets/Dandelion_Petals_16.png'),
  17: require('../../assets/Dandelion_Petals_17.png'),
  18: require('../../assets/Dandelion_Petals_18.png'),
  19: require('../../assets/Dandelion_Petals_19.png'),
  20: require('../../assets/Dandelion_Petals_20.png'),
  21: require('../../assets/Dandelion_Petals_21.png'),
  22: require('../../assets/Dandelion_Petals_22.png'),
  23: require('../../assets/Dandelion_Petals_23.png'),
  24: require('../../assets/Dandelion_Petals_24.png'),
  25: require('../../assets/Dandelion_Petals_25.png'),
  26: require('../../assets/Dandelion_Petals_26.png'),
  27: require('../../assets/Dandelion_Petals_27.png'),
  28: require('../../assets/Dandelion_Petals_28.png'),
  29: require('../../assets/Dandelion_Petals_29.png'),
  30: require('../../assets/Dandelion_Petals_30.png'),
  31: require('../../assets/Dandelion_Petals_31.png'),
  32: require('../../assets/Dandelion_Petals_32.png'),
  33: require('../../assets/Dandelion_Petals_33.png'),
  34: require('../../assets/Dandelion_Petals_34.png'),
  35: require('../../assets/Dandelion_Petals_35.png'),
  36: require('../../assets/Dandelion_Petals_36.png'),
  37: require('../../assets/Dandelion_Petals_37.png'),
  38: require('../../assets/Dandelion_Petals_38.png'),
  39: require('../../assets/Dandelion_Petals_39.png'),
  40: require('../../assets/Dandelion_Petals_40.png'),
};

// Note: Individual seed images don't exist, we'll use the single seed image for floating seeds

export class DandelionStateManager {
  private static instance: DandelionStateManager;
  private currentState: DandelionState = {
    petalCount: 40,
    seedCount: 0,
    phase: 'inhale',
    progress: 0
  };

  private constructor() {}

  static getInstance(): DandelionStateManager {
    if (!DandelionStateManager.instance) {
      DandelionStateManager.instance = new DandelionStateManager();
    }
    return DandelionStateManager.instance;
  }

  /**
   * Update the dandelion state based on breathing phase and progress
   * @param phase Current breathing phase
   * @param progress Progress within the phase (0-1)
   */
  updateState(phase: 'inhale' | 'hold' | 'exhale', progress: number): DandelionState {
    this.currentState.phase = phase;
    this.currentState.progress = Math.max(0, Math.min(1, progress));

    switch (phase) {
      case 'inhale':
        // During inhale, petals fall off (40 → 0)
        this.currentState.petalCount = Math.max(0, Math.round(40 - (progress * 40)));
        this.currentState.seedCount = 0;
        break;
      
      case 'hold':
        // During hold, maintain current state
        break;
      
      case 'exhale':
        // During exhale, seeds appear (1 → 40)
        this.currentState.petalCount = 0;
        this.currentState.seedCount = Math.max(1, Math.round(progress * 39) + 1);
        break;
    }

    return { ...this.currentState };
  }

  /**
   * Get the current dandelion state
   */
  getCurrentState(): DandelionState {
    return { ...this.currentState };
  }

  /**
   * Reset the dandelion to initial state (full petals)
   */
  reset(): void {
    this.currentState = {
      petalCount: 40,
      seedCount: 0,
      phase: 'inhale',
      progress: 0
    };
  }

  /**
   * Get the image source for the current dandelion head state
   */
  getDandelionHeadImageSource(): any {
    const { petalCount, seedCount, phase } = this.currentState;

    // If we have petals, show petal state
    if (petalCount > 0 && petalCount <= 40) {
      return PETAL_IMAGES[petalCount as keyof typeof PETAL_IMAGES];
    }
    
    // For seeds, we don't have individual seed head images, so show empty head
    // The floating seeds will be handled separately in the visual component
    if (seedCount > 0) {
      return null; // No head image for seeds, just floating individual seeds
    }

    // If no petals or seeds, show the stem only (no head image)
    return null;
  }

  /**
   * Check if we should create floating elements based on state changes
   */
  shouldCreateFloatingElement(previousState: DandelionState): {
    createPetal: boolean;
    createSeed: boolean;
  } {
    const current = this.currentState;
    
    return {
      createPetal: current.petalCount < previousState.petalCount && current.phase === 'inhale',
      createSeed: current.seedCount > previousState.seedCount && current.phase === 'exhale'
    };
  }
}

export default DandelionStateManager;
