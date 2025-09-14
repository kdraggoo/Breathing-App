import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface DandelionVisualProps {
  currentPhase: 'inhale' | 'hold' | 'exhale';
  isActive: boolean;
}

interface FloatingElement {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

const DandelionVisual: React.FC<DandelionVisualProps> = ({ currentPhase, isActive }) => {
  const [floatingPetals, setFloatingPetals] = React.useState<FloatingElement[]>([]);
  const [floatingSeeds, setFloatingSeeds] = React.useState<FloatingElement[]>([]);
  const [petalIdCounter, setPetalIdCounter] = React.useState(0);
  const [seedIdCounter, setSeedIdCounter] = React.useState(0);
  const [isDandelionBackground, setIsDandelionBackground] = useState(true);
  
  const flowerScale = useRef(new Animated.Value(1)).current;
  const stemOpacity = useRef(new Animated.Value(0)).current;
  const seedOpacity = useRef(new Animated.Value(0)).current;

  const handleBackgroundTap = () => {
    setIsDandelionBackground(prev => !prev);
  };

  // Create floating petal
  const createFloatingPetal = (): FloatingElement => {
    const id = petalIdCounter;
    setPetalIdCounter(prev => prev + 1);
    
    return {
      id,
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2 - 100),
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
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2 - 100),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0.6),
      opacity: new Animated.Value(1),
    };
  };

  // Animate petal floating toward user
  const animatePetalFloat = (petal: FloatingElement) => {
    const randomX = Math.random() * (width - 100) + 50;
    const randomY = Math.random() * 200 + height / 2 - 50;
    const randomRotation = Math.random() * 720 - 360;
    
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
    const randomX = Math.random() * width;
    const randomY = Math.random() * height;
    const randomRotation = Math.random() * 720 - 360;
    
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

  useEffect(() => {
    if (!isActive) return;

    switch (currentPhase) {
      case 'inhale':
        // Petals fall off and float toward user
        const newPetal = createFloatingPetal();
        setFloatingPetals(prev => [...prev, newPetal]);
        setTimeout(() => animatePetalFloat(newPetal), 100);
        
        // Slightly shrink the flower
        Animated.timing(flowerScale, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        break;

      case 'hold':
        // Show seeds on stem
        Animated.parallel([
          Animated.timing(stemOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(seedOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'exhale':
        // Seeds scatter away
        const newSeed = createFloatingSeed();
        setFloatingSeeds(prev => [...prev, newSeed]);
        setTimeout(() => animateSeedScatter(newSeed), 100);
        
        // Hide seeds on stem
        Animated.parallel([
          Animated.timing(stemOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(seedOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Flower grows back to normal size
        Animated.timing(flowerScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        break;
    }
  }, [currentPhase, isActive]);

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
            transform: [{ scale: flowerScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/Dandelion_Flower_with_Background.png')}
          style={styles.flowerImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Stem with seeds (appears during hold phase) */}
      <Animated.View
        style={[
          styles.stemContainer,
          {
            opacity: stemOpacity,
          },
        ]}
      >
        <Image
          source={require('../../assets/Dandelion_Stem.png')}
          style={styles.stemImage}
          resizeMode="contain"
        />
        <Animated.View
          style={[
            styles.seedsContainer,
            {
              opacity: seedOpacity,
            },
          ]}
        >
          <Image
            source={require('../../assets/Dandelion_Seed.png')}
            style={styles.seedOnStemImage}
            resizeMode="contain"
          />
        </Animated.View>
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
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    height: 200,
  },
  flowerImage: {
    width: '100%',
    height: '100%',
  },
  stemContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    width: 100,
    height: 200,
  },
  stemImage: {
    width: '100%',
    height: '100%',
  },
  seedsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  seedOnStemImage: {
    width: '100%',
    height: '100%',
  },
  floatingElement: {
    position: 'absolute',
    width: 40,
    height: 40,
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
