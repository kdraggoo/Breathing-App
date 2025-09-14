import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PhysicsObject as PhysicsObjectType } from '../types';
import { breathingPhysicsEngine, createBubble, createLeaf, createFeather, createSparkle } from '../utils/physicsEngine';
import PhysicsObject from './PhysicsObject';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhysicsLayerProps {
  isActive: boolean;
  currentPhase: 'inhale' | 'hold' | 'exhale';
  phaseProgress: number;
  userPosition?: { x: number; y: number };
  enabledObjectTypes?: ('bubble' | 'leaf' | 'feather' | 'sparkle' | 'particle')[];
  maxObjects?: number;
  spawnRate?: number;
  forceStrength?: number;
}

const PhysicsLayer: React.FC<PhysicsLayerProps> = ({
  isActive,
  currentPhase,
  phaseProgress,
  userPosition = { x: screenWidth / 2, y: screenHeight / 2 },
  enabledObjectTypes = ['bubble', 'leaf', 'feather', 'sparkle'],
  maxObjects = 15,
  spawnRate = 0.3,
  forceStrength = 100,
}) => {
  const [physicsObjects, setPhysicsObjects] = useState<PhysicsObjectType[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Initialize physics engine configuration
    if (!isInitializedRef.current) {
      breathingPhysicsEngine.updateConfig({
        maxObjects,
        spawnRate,
        baseForceStrength: forceStrength,
      });
      isInitializedRef.current = true;
    }
  }, [maxObjects, spawnRate, forceStrength]);

  useEffect(() => {
    // Update user position in physics engine
    breathingPhysicsEngine.setUserPosition(userPosition.x, userPosition.y);
  }, [userPosition.x, userPosition.y]);

  useEffect(() => {
    // Update breathing phase in physics engine
    breathingPhysicsEngine.updateBreathingPhase(currentPhase, phaseProgress);
  }, [currentPhase, phaseProgress]);

  useEffect(() => {
    if (isActive) {
      // Start physics simulation
      breathingPhysicsEngine.start((objects) => {
        setPhysicsObjects(objects);
      });

      // Add some initial objects
      addInitialObjects();
    } else {
      // Stop physics simulation
      breathingPhysicsEngine.stop();
      breathingPhysicsEngine.clearObjects();
      setPhysicsObjects([]);
    }

    return () => {
      breathingPhysicsEngine.stop();
    };
  }, [isActive]);

  const addInitialObjects = () => {
    const objectCreators = {
      bubble: createBubble,
      leaf: createLeaf,
      feather: createFeather,
      sparkle: createSparkle,
    };

    // Add a few initial objects of enabled types
    for (let i = 0; i < 5; i++) {
      const randomType = enabledObjectTypes[Math.floor(Math.random() * enabledObjectTypes.length)];
      
      if (randomType === 'particle') {
        breathingPhysicsEngine.addObject({
          visualType: 'particle',
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 4)],
        });
      } else if (objectCreators[randomType]) {
        breathingPhysicsEngine.addObject(objectCreators[randomType]());
      }
    }
  };

  const addObjectAtPosition = (x: number, y: number) => {
    const randomType = enabledObjectTypes[Math.floor(Math.random() * enabledObjectTypes.length)];
    
    if (randomType === 'particle') {
      breathingPhysicsEngine.addObject({
        x,
        y,
        visualType: 'particle',
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 4)],
      });
    } else {
      const objectCreators = {
        bubble: createBubble,
        leaf: createLeaf,
        feather: createFeather,
        sparkle: createSparkle,
      };
      
      if (objectCreators[randomType]) {
        breathingPhysicsEngine.addObject(objectCreators[randomType](x, y));
      }
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {physicsObjects.map((object) => (
        <PhysicsObject key={object.id} object={object} />
      ))}
      
      {/* Debug info - can be removed in production */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <View style={[styles.userPosition, {
            left: userPosition.x - 5,
            top: userPosition.y - 5,
          }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  debugInfo: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  userPosition: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    opacity: 0.5,
  },
});

export default PhysicsLayer;