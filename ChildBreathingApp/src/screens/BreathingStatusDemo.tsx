import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useBreathingDetector from '../hooks/useBreathingDetector';
import BreathingStatusIndicator from '../components/BreathingStatusIndicator';

const BreathingStatusDemo: React.FC = () => {
  const navigation = useNavigation();
  const [demoMode, setDemoMode] = useState<'manual' | 'auto'>('manual');

  const {
    breathingState,
    isDetecting,
    startDetection,
    stopDetection,
    startBreathingIn,
    startBreathingOut,
    startPause,
  } = useBreathingDetector({
    manualMode: demoMode === 'manual',
    sensitivityThreshold: 0.3,
    pauseDetectionTime: 1000,
  });

  const handleToggleDetection = () => {
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  const getStatusDescription = () => {
    switch (breathingState.status) {
      case 'breathing_in':
        return 'The user is currently breathing in. The visual indicator expands and shows an upward animation.';
      case 'breathing_out':
        return 'The user is breathing out. The visual indicator contracts and shows a downward animation.';
      case 'pausing':
        return 'The user is holding their breath or pausing between breaths. The indicator shows a steady state.';
      case 'idle':
        return 'No breathing activity detected. The system is ready to start monitoring.';
      default:
        return 'Unknown breathing state.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Breathing Status Demo</Text>
          <Text style={styles.subtitle}>
            Monitor and understand breathing patterns in real-time
          </Text>
        </View>

        {/* Main Status Display */}
        <View style={styles.statusSection}>
          <BreathingStatusIndicator
            breathingState={breathingState}
            onBreathingIn={startBreathingIn}
            onBreathingOut={startBreathingOut}
            onPause={startPause}
            showManualControls={demoMode === 'manual'}
            size="large"
            theme="colorful"
          />
        </View>

        {/* Status Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Current Status</Text>
          <Text style={styles.statusText}>
            Status: <Text style={styles.statusValue}>{breathingState.status.replace('_', ' ').toUpperCase()}</Text>
          </Text>
          <Text style={styles.statusText}>
            Intensity: <Text style={styles.statusValue}>{(breathingState.intensity * 100).toFixed(0)}%</Text>
          </Text>
          <Text style={styles.statusText}>
            Duration: <Text style={styles.statusValue}>{Math.floor(breathingState.duration / 1000)}s</Text>
          </Text>
          <Text style={styles.statusText}>
            Detection: <Text style={styles.statusValue}>{isDetecting ? 'Active' : 'Inactive'}</Text>
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>What's Happening?</Text>
          <Text style={styles.descriptionText}>{getStatusDescription()}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isDetecting ? '#E17055' : '#00B894' }]}
            onPress={handleToggleDetection}
          >
            <Text style={styles.controlButtonText}>
              {isDetecting ? 'Stop Detection' : 'Start Detection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: demoMode === 'manual' ? '#6C5CE7' : '#74B9FF' }]}
            onPress={() => setDemoMode(demoMode === 'manual' ? 'auto' : 'manual')}
          >
            <Text style={styles.modeButtonText}>
              Mode: {demoMode === 'manual' ? 'Manual' : 'Auto'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Manual Mode:</Text> Use the control buttons to simulate breathing states
          </Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Auto Mode:</Text> Future sensor integration will automatically detect breathing
          </Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Visual Feedback:</Text> The indicator changes color and size based on breathing status
          </Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Intensity Bar:</Text> Shows the strength/depth of breathing activity
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 5,
  },
  statusValue: {
    fontWeight: 'bold',
    color: '#2D3436',
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
  },
  controlsSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  controlButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  instructionItem: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2D3436',
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#636E72',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BreathingStatusDemo;