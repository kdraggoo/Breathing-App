import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useBreathingDetector from '../hooks/useBreathingDetector';
import BreathingStatusIndicator from '../components/BreathingStatusIndicator';
import { SensorType } from '../sensors/MultiSensorBreathingDetector';

const SensorBreathingDemo: React.FC = () => {
  const navigation = useNavigation();
  const [selectedSensors, setSelectedSensors] = useState<SensorType[]>(['microphone', 'accelerometer']);
  const [sensorFusionEnabled, setSensorFusionEnabled] = useState(true);
  const [manualMode, setManualMode] = useState(false);

  const {
    breathingState,
    isDetecting,
    startDetection,
    stopDetection,
    startBreathingIn,
    startBreathingOut,
    startPause,
    sensorAvailability,
    activeSensors,
    sensorFusionResult,
    checkSensorAvailability,
    // config,
  } = useBreathingDetector({
    enabledSensors: selectedSensors,
    sensorFusion: sensorFusionEnabled,
    manualMode,
    sensitivityThreshold: 0.3,
  });

  useEffect(() => {
    // Check sensor availability on mount
    checkSensorAvailability();
  }, [checkSensorAvailability]);

  const handleToggleSensor = (sensor: SensorType) => {
    if (isDetecting) {
      Alert.alert('Stop Detection', 'Please stop detection before changing sensors.');
      return;
    }

    setSelectedSensors(prev => 
      prev.includes(sensor) 
        ? prev.filter(s => s !== sensor)
        : [...prev, sensor]
    );
  };

  const handleStartStop = async () => {
    if (isDetecting) {
      stopDetection();
    } else {
      if (!manualMode && selectedSensors.length === 0) {
        Alert.alert('No Sensors', 'Please select at least one sensor for automatic detection.');
        return;
      }

      const started = await startDetection();
      if (!started && !manualMode) {
        Alert.alert(
          'Detection Failed', 
          'Failed to start sensor detection. Please check permissions and try again.'
        );
      }
    }
  };

  const getSensorStatusColor = (sensor: SensorType) => {
    if (!sensorAvailability[sensor as keyof typeof sensorAvailability]) {
      return '#FF6B6B'; // Red for unavailable
    }
    if (activeSensors.includes(sensor)) {
      return '#00B894'; // Green for active
    }
    if (selectedSensors.includes(sensor)) {
      return '#74B9FF'; // Blue for selected but not active
    }
    return '#DDD'; // Gray for unselected
  };

  const getSensorStatusText = (sensor: SensorType) => {
    const available = sensorAvailability[sensor as keyof typeof sensorAvailability];
    const active = activeSensors.includes(sensor);
    const selected = selectedSensors.includes(sensor);

    if (!available) return 'Unavailable';
    if (active) return 'Active';
    if (selected) return 'Selected';
    return 'Available';
  };

  const renderSensorCard = (sensor: SensorType, icon: string, title: string, description: string) => (
    <View key={sensor} style={styles.sensorCard}>
      <View style={styles.sensorHeader}>
        <Text style={styles.sensorIcon}>{icon}</Text>
        <View style={styles.sensorInfo}>
          <Text style={styles.sensorTitle}>{title}</Text>
          <Text style={styles.sensorDescription}>{description}</Text>
        </View>
        <View style={styles.sensorControls}>
          <View style={[styles.statusDot, { backgroundColor: getSensorStatusColor(sensor) }]} />
          <Text style={styles.statusText}>{getSensorStatusText(sensor)}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.sensorToggle,
          { 
            backgroundColor: selectedSensors.includes(sensor) ? '#6C5CE7' : '#DDD',
            opacity: sensorAvailability[sensor as keyof typeof sensorAvailability] ? 1 : 0.5,
          }
        ]}
        onPress={() => handleToggleSensor(sensor)}
        disabled={!sensorAvailability[sensor as keyof typeof sensorAvailability]}
      >
        <Text style={[
          styles.toggleText,
          { color: selectedSensors.includes(sensor) ? '#FFF' : '#666' }
        ]}>
          {selectedSensors.includes(sensor) ? 'Enabled' : 'Disabled'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Multi-Sensor Breathing Detection</Text>
          <Text style={styles.subtitle}>
            Experience advanced breathing detection using multiple smartphone sensors
          </Text>
        </View>

        {/* Mode Selection */}
        <View style={styles.modeSection}>
          <Text style={styles.sectionTitle}>Detection Mode</Text>
          <View style={styles.modeToggle}>
            <Text style={styles.modeLabel}>Manual Control</Text>
            <Switch
              value={manualMode}
              onValueChange={setManualMode}
              disabled={isDetecting}
              thumbColor={manualMode ? '#6C5CE7' : '#FFF'}
              trackColor={{ false: '#DDD', true: '#6C5CE7' }}
            />
            <Text style={styles.modeLabel}>Sensor Auto</Text>
          </View>
          
          {!manualMode && (
            <View style={styles.fusionToggle}>
              <Text style={styles.fusionLabel}>Sensor Fusion</Text>
              <Switch
                value={sensorFusionEnabled}
                onValueChange={setSensorFusionEnabled}
                disabled={isDetecting}
                thumbColor={sensorFusionEnabled ? '#00B894' : '#FFF'}
                trackColor={{ false: '#DDD', true: '#00B894' }}
              />
            </View>
          )}
        </View>

        {/* Sensor Selection */}
        {!manualMode && (
          <View style={styles.sensorsSection}>
            <Text style={styles.sectionTitle}>Available Sensors</Text>
            
            {renderSensorCard(
              'microphone',
              '🎤',
              'Microphone Detection',
              'Analyzes breathing sounds and airflow patterns'
            )}
            
            {renderSensorCard(
              'accelerometer',
              '📱',
              'Motion Detection',
              'Monitors chest movement using device sensors'
            )}
            
            {renderSensorCard(
              'camera',
              '📷',
              'Visual Detection',
              'Tracks breathing through subtle chest movements'
            )}
          </View>
        )}

        {/* Status Display */}
        <View style={styles.statusSection}>
          <BreathingStatusIndicator
            breathingState={breathingState}
            onBreathingIn={startBreathingIn}
            onBreathingOut={startBreathingOut}
            onPause={startPause}
            showManualControls={manualMode}
            size="large"
            theme="colorful"
          />
        </View>

        {/* Sensor Fusion Results */}
        {sensorFusionResult && !manualMode && (
          <View style={styles.fusionSection}>
            <Text style={styles.sectionTitle}>Sensor Fusion Analysis</Text>
            <View style={styles.fusionData}>
              <Text style={styles.fusionText}>
                Active Sensors: {activeSensors.join(', ') || 'None'}
              </Text>
              <Text style={styles.fusionText}>
                Fusion Confidence: {(sensorFusionResult.fusionConfidence * 100).toFixed(0)}%
              </Text>
              <Text style={styles.fusionText}>
                Recommended: {sensorFusionResult.recommendedSensor}
              </Text>
            </View>
            
            {/* Individual Sensor Contributions */}
            <View style={styles.contributionsSection}>
              <Text style={styles.contributionsTitle}>Sensor Contributions:</Text>
              {Object.entries(sensorFusionResult.sensorContributions).map(([sensor, data]) => (
                <View key={sensor} style={styles.contributionItem}>
                  <Text style={styles.contributionSensor}>{sensor}:</Text>
                  <Text style={styles.contributionValue}>
                    {(data.result.confidence * 100).toFixed(0)}% (weight: {data.weight})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Detection Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Detection Status</Text>
          <Text style={styles.infoText}>
            Status: <Text style={styles.infoValue}>{breathingState.status.replace('_', ' ').toUpperCase()}</Text>
          </Text>
          <Text style={styles.infoText}>
            Intensity: <Text style={styles.infoValue}>{(breathingState.intensity * 100).toFixed(0)}%</Text>
          </Text>
          <Text style={styles.infoText}>
            Duration: <Text style={styles.infoValue}>{Math.floor(breathingState.duration / 1000)}s</Text>
          </Text>
          <Text style={styles.infoText}>
            Mode: <Text style={styles.infoValue}>{manualMode ? 'Manual' : 'Automatic'}</Text>
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isDetecting ? '#E17055' : '#00B894' }]}
            onPress={handleStartStop}
          >
            <Text style={styles.controlButtonText}>
              {isDetecting ? 'Stop Detection' : 'Start Detection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How It Works</Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Microphone:</Text> Detects breathing sounds and airflow patterns
          </Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Accelerometer:</Text> Monitors chest movement when phone is placed on chest
          </Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Camera:</Text> Tracks subtle movements in chest/shoulder area
          </Text>
          <Text style={styles.instructionItem}>
            • <Text style={styles.bold}>Sensor Fusion:</Text> Combines multiple sensors for improved accuracy
          </Text>
        </View>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 22,
  },
  modeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 15,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  modeLabel: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '600',
  },
  fusionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  fusionLabel: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '600',
  },
  sensorsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sensorCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 2,
  },
  sensorDescription: {
    fontSize: 12,
    color: '#636E72',
  },
  sensorControls: {
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#636E72',
    fontWeight: '600',
  },
  sensorToggle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  fusionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  fusionData: {
    marginBottom: 15,
  },
  fusionText: {
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 5,
  },
  contributionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  contributionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  contributionSensor: {
    fontSize: 12,
    color: '#636E72',
    textTransform: 'capitalize',
  },
  contributionValue: {
    fontSize: 12,
    color: '#2D3436',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 5,
  },
  infoValue: {
    fontWeight: 'bold',
    color: '#2D3436',
  },
  controlsSection: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
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
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
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
});

export default SensorBreathingDemo;