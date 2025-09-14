import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BreathingStatus, BreathingState } from '../types';

const { width } = Dimensions.get('window');

interface BreathingStatusIndicatorProps {
  breathingState: BreathingState;
  onBreathingIn?: () => void;
  onBreathingOut?: () => void;
  onPause?: () => void;
  showManualControls?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'colorful';
}

const BreathingStatusIndicator: React.FC<BreathingStatusIndicatorProps> = ({
  breathingState,
  onBreathingIn,
  onBreathingOut,
  onPause,
  showManualControls = true,
  size = 'medium',
  theme = 'colorful',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const intensityAnim = useRef(new Animated.Value(0)).current;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { indicator: 80, text: 14, button: 50 };
      case 'large':
        return { indicator: 200, text: 20, button: 80 };
      default:
        return { indicator: 120, text: 16, button: 60 };
    }
  };

  const sizeConfig = getSizeConfig();

  const getStatusColor = (status: BreathingStatus) => {
    switch (status) {
      case 'breathing_in':
        return theme === 'colorful' ? '#4ECDC4' : '#007AFF';
      case 'breathing_out':
        return theme === 'colorful' ? '#FF6B6B' : '#FF3B30';
      case 'pausing':
        return theme === 'colorful' ? '#FFD93D' : '#FF9500';
      default:
        return theme === 'colorful' ? '#95A5A6' : '#8E8E93';
    }
  };

  const getStatusText = (status: BreathingStatus) => {
    switch (status) {
      case 'breathing_in':
        return 'Breathing In 🌬️';
      case 'breathing_out':
        return 'Breathing Out 💨';
      case 'pausing':
        return 'Holding 🤗';
      default:
        return 'Ready ✨';
    }
  };

  const getStatusEmoji = (status: BreathingStatus) => {
    switch (status) {
      case 'breathing_in':
        return '🫁';
      case 'breathing_out':
        return '💨';
      case 'pausing':
        return '⏸️';
      default:
        return '😌';
    }
  };

  useEffect(() => {
    const { status, intensity } = breathingState;

    // Animate pulse based on breathing status
    if (status === 'breathing_in') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (status === 'breathing_out') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (status === 'pausing') {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnim.setValue(1);
    }

    // Animate color transition
    let colorValue = 0;
    switch (status) {
      case 'breathing_in':
        colorValue = 1;
        break;
      case 'breathing_out':
        colorValue = 2;
        break;
      case 'pausing':
        colorValue = 3;
        break;
      default:
        colorValue = 0;
    }

    Animated.timing(colorAnim, {
      toValue: colorValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Animate intensity
    Animated.timing(intensityAnim, {
      toValue: intensity,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [breathingState, pulseAnim, colorAnim, intensityAnim]);

  const formatDuration = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    return `${seconds}s`;
  };

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      getStatusColor('idle'),
      getStatusColor('breathing_in'),
      getStatusColor('breathing_out'),
      getStatusColor('pausing'),
    ],
  });

  const intensityHeight = intensityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sizeConfig.indicator * 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Main Status Indicator */}
      <View style={styles.indicatorContainer}>
        <Animated.View
          style={[
            styles.statusIndicator,
            {
              width: sizeConfig.indicator,
              height: sizeConfig.indicator,
              backgroundColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={[styles.statusEmoji, { fontSize: sizeConfig.indicator * 0.4 }]}>
            {getStatusEmoji(breathingState.status)}
          </Text>
        </Animated.View>

        {/* Intensity Bar */}
        <View style={[styles.intensityBarContainer, { height: sizeConfig.indicator * 0.8 }]}>
          <Animated.View
            style={[
              styles.intensityBar,
              {
                height: intensityHeight,
                backgroundColor: getStatusColor(breathingState.status),
              },
            ]}
          />
        </View>
      </View>

      {/* Status Text */}
      <Text style={[styles.statusText, { fontSize: sizeConfig.text }]}>
        {getStatusText(breathingState.status)}
      </Text>

      {/* Duration */}
      {breathingState.duration > 0 && (
        <Text style={styles.durationText}>
          {formatDuration(breathingState.duration)}
        </Text>
      )}

      {/* Manual Controls */}
      {showManualControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { 
                width: sizeConfig.button,
                height: sizeConfig.button,
                backgroundColor: getStatusColor('breathing_in'),
              },
            ]}
            onPress={onBreathingIn}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { 
                width: sizeConfig.button,
                height: sizeConfig.button,
                backgroundColor: getStatusColor('pausing'),
              },
            ]}
            onPress={onPause}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>Hold</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { 
                width: sizeConfig.button,
                height: sizeConfig.button,
                backgroundColor: getStatusColor('breathing_out'),
              },
            ]}
            onPress={onBreathingOut}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginRight: 15,
  },
  statusEmoji: {
    color: '#fff',
    fontWeight: 'bold',
  },
  intensityBarContainer: {
    width: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  intensityBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  statusText: {
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 5,
    textAlign: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '600',
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: 250,
    gap: 15,
  },
  controlButton: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default BreathingStatusIndicator;