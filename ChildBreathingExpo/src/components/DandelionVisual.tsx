import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import SoundManager from '../utils/soundManager';
import DandelionStateManager from '../utils/dandelionStateManager';
import { DandelionState } from '../types';

const { width, height } = Dimensions.get('window');

interface DandelionVisualProps {
  currentPhase: 'inhale' | 'hold' | 'exhale';
  isActive: boolean;
  phaseProgress?: number; // 0-1 progress within current phase
}

interface FloatingElement {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

const DandelionVisual: React.FC<DandelionVisualProps> = ({ 
  currentPhase, 
  isActive, 
  phaseProgress = 0 
}) => {
  const [floatingPetals, setFloatingPetals] = React.useState<FloatingElement[]>([]);
  const [floatingSeeds, setFloatingSeeds] = React.useState<FloatingElement[]>([]);
  const [petalIdCounter, setPetalIdCounter] = React.useState(0);
  const [seedIdCounter, setSeedIdCounter] = React.useState(0);
  const [isDandelionBackground, setIsDandelionBackground] = useState(true);
  const [dandelionState, setDandelionState] = useState<DandelionState>({
    petalCount: 40,
    seedCount: 0,
    phase: 'inhale',
    progress: 0
  });
  
  const soundManager = SoundManager.getInstance();
  const stateManager = DandelionStateManager.getInstance();

  const handleBackgroundTap = () => {
    setIsDandelionBackground(prev => !prev);
  };

  // Create floating petal
  const createFloatingPetal = (): FloatingElement => {
    const id = petalIdCounter;
    setPetalIdCounter(prev => prev + 1);
    
    return {
      id,
      x: new Animated.Value(width / 2 - 100), // Center of petal aligns with stem center (subtract half petal width)
      y: new Animated.Value(height / 2 - 200), // Bottom of petal aligns with top of stem (subtract full petal height)
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0.8),
      opacity: new Animated.Value(1),
    };
  };

  // Create floating seed
  const createFloatingSeed = (): FloatingElement => {
    const id = seedIdCounter;
    setSeedIdCounter(prev => prev + 1);
    
    return {
      id,
      x: new Animated.Value(width / 2 - 100), // Center of seed aligns with stem center (subtract half seed width)
      y: new Animated.Value(height / 2 - 200), // Bottom of seed aligns with top of stem (subtract full seed height)
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0.6),
      opacity: new Animated.Value(1),
    };
  };

  // Animate petal floating toward user
  const animatePetalFloat = (petal: FloatingElement) => {
    const randomX = Math.random() * (width - 200) + 100;
    const randomY = Math.random() * 200 + height / 2 - 50;
    const randomRotation = Math.random() * 720 - 360;
    
    // Play subtle sound when petal starts floating
    soundManager.playInhaleSound();
    
    Animated.parallel([
      Animated.timing(petal.x, {
        toValue: randomX,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(petal.y, {
        toValue: randomY,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(petal.rotation, {
        toValue: randomRotation,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(petal.scale, {
        toValue: 0.3,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(petal.opacity, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove petal after animation
      setFloatingPetals(prev => prev.filter(p => p.id !== petal.id));
    });
  };

  // Animate seed scattering away from user
  const animateSeedScatter = (seed: FloatingElement) => {
    const randomX = Math.random() * (width - 200) + 100;
    const randomY = Math.random() * (height - 200) + 100;
    const randomRotation = Math.random() * 720 - 360;
    
    // Play subtle sound when seed starts scattering
    soundManager.playExhaleSound();
    
    Animated.parallel([
      Animated.timing(seed.x, {
        toValue: randomX,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(seed.y, {
        toValue: randomY,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(seed.rotation, {
        toValue: randomRotation,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(seed.scale, {
        toValue: 0.1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(seed.opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove seed after animation
      setFloatingSeeds(prev => prev.filter(s => s.id !== seed.id));
    });
  };

  // Update dandelion state based on breathing phase and progress
  useEffect(() => {
    if (!isActive) return;

    const previousState = dandelionState;
    const newState = stateManager.updateState(currentPhase, phaseProgress);
    setDandelionState(newState);

    // Check if we should create floating elements
    const shouldCreate = stateManager.shouldCreateFloatingElement(previousState);
    
    if (shouldCreate.createPetal) {
      const newPetal = createFloatingPetal();
      setFloatingPetals(prev => [...prev, newPetal]);
      setTimeout(() => animatePetalFloat(newPetal), 100);
    }
    
    if (shouldCreate.createSeed) {
      const newSeed = createFloatingSeed();
      setFloatingSeeds(prev => [...prev, newSeed]);
      setTimeout(() => animateSeedScatter(newSeed), 100);
    }
  }, [currentPhase, phaseProgress, isActive]);

  // Reset dandelion state when exercise stops
  useEffect(() => {
    if (!isActive) {
      stateManager.reset();
      setDandelionState({
        petalCount: 40,
        seedCount: 0,
        phase: 'inhale',
        progress: 0
      });
    }
  }, [isActive]);

  const renderFloatingPetals = () => {
    return floatingPetals.map((petal) => {
      const rotation = petal.rotation.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <Animated.View
          key={petal.id}
          style={[
            styles.floatingElement,
            {
              transform: [
                { translateX: petal.x },
                { translateY: petal.y },
                { rotate: rotation },
                { scale: petal.scale },
              ],
              opacity: petal.opacity,
            },
          ]}
        >
          <Image
            source={require('../../assets/Dandelion_Petal.png')}
            style={styles.petalImage}
            resizeMode="contain"
          />
        </Animated.View>
      );
    });
  };

  const renderFloatingSeeds = () => {
    return floatingSeeds.map((seed) => {
      const rotation = seed.rotation.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <Animated.View
          key={seed.id}
          style={[
            styles.floatingElement,
            {
              transform: [
                { translateX: seed.x },
                { translateY: seed.y },
                { rotate: rotation },
                { scale: seed.scale },
              ],
              opacity: seed.opacity,
            },
          ]}
        >
          <Image
            source={require('../../assets/Dandelion_Seed.png')}
            style={styles.seedImage}
            resizeMode="contain"
          />
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <TouchableOpacity 
        style={styles.backgroundContainer}
        onPress={handleBackgroundTap}
        activeOpacity={1}
      >
        <Image
          source={isDandelionBackground 
            ? require('../../assets/Dandelion_Field_Background.png')
            : require('../../assets/Sky_Background.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      
      {/* Main dandelion flower */}
      <Animated.View
        style={[
          styles.flowerContainer,
          {
            transform: [
              { translateX: -100 }, // Half of container width (200px / 2)
              { translateY: -100 }  // Half of container height (200px / 2)
            ],
          },
        ]}
      >
        {/* Dandelion stem */}
        <Image
          source={require('../../assets/Dandelion_Stem.png')}
          style={styles.stemImage}
          resizeMode="contain"
        />
        
        {/* Dynamic dandelion head based on current state */}
        {stateManager.getDandelionHeadImageSource() && (
          <Image
            source={stateManager.getDandelionHeadImageSource()}
            style={styles.headImage}
            resizeMode="contain"
          />
        )}
      </Animated.View>


      {/* Floating petals */}
      {renderFloatingPetals()}

      {/* Floating seeds */}
      {renderFloatingSeeds()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  flowerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stemImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 1,
  },
  headImage: {
    width: '80%',
    height: '80%',
    position: 'absolute',
    top: '10%',
    left: '10%',
    zIndex: 2,
  },
  floatingElement: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  petalImage: {
    width: '100%',
    height: '100%',
  },
  seedImage: {
    width: '100%',
    height: '100%',
  },
});

export default DandelionVisual;
