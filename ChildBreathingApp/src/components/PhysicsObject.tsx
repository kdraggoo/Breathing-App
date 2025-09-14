import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PhysicsObject as PhysicsObjectType } from '../types';

interface PhysicsObjectProps {
  object: PhysicsObjectType;
}

const PhysicsObject: React.FC<PhysicsObjectProps> = ({ object }) => {
  const getVisualContent = () => {
    switch (object.visualType) {
      case 'bubble':
        return '💧';
      case 'leaf':
        return '🍃';
      case 'feather':
        return '🪶';
      case 'sparkle':
        return '✨';
      case 'particle':
      default:
        return '●';
    }
  };

  const dynamicStyles = {
    position: 'absolute' as const,
    left: object.x - object.size / 2,
    top: object.y - object.size / 2,
    width: object.size,
    height: object.size,
    backgroundColor: object.visualType === 'particle' ? object.color : 'transparent',
    borderRadius: object.size / 2,
    opacity: object.isAffectedByBreathing ? 0.8 : 0.4,
  };

  return (
    <View style={[styles.container, dynamicStyles]}>
      {object.visualType !== 'particle' && (
        <Text style={[styles.emoji, { fontSize: object.size * 0.8 }]}>
          {getVisualContent()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  emoji: {
    textAlign: 'center',
  },
});

export default PhysicsObject;