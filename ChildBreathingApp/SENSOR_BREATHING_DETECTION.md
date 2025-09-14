# Multi-Sensor Breathing Detection System

## Overview

This document describes the advanced multi-sensor breathing detection system that uses various smartphone sensors to automatically detect and analyze breathing patterns in real-time. The system supports microphone, accelerometer, gyroscope, and camera-based detection with intelligent sensor fusion.

## 🎯 **Key Features**

### 1. **Multi-Sensor Support**
- **Microphone Detection**: Analyzes breathing sounds and airflow patterns
- **Accelerometer Detection**: Monitors chest movement when device is placed on chest
- **Camera Detection**: Tracks subtle movements in chest/shoulder area using computer vision
- **Sensor Fusion**: Combines multiple sensors for improved accuracy and reliability

### 2. **Intelligent Sensor Fusion**
- **Weighted Average**: Combines sensor readings based on confidence weights
- **Highest Confidence**: Uses the most confident sensor at any given moment
- **Majority Vote**: Democratic decision-making across sensors
- **Adaptive Fusion**: Automatically switches to the best-performing sensor

### 3. **Real-Time Analysis**
- Continuous breathing pattern monitoring
- Live breathing rate calculation (breaths per minute)
- Breathing phase detection (inhale, exhale, pause)
- Confidence scoring for reliability assessment

## 🛠 **Technical Architecture**

### Core Components

#### 1. Individual Sensor Detectors

**MicrophoneBreathingDetector**
```typescript
// Features:
- Audio recording and analysis
- Frequency domain analysis (FFT)
- Breathing sound pattern recognition
- Noise filtering and calibration
- Real-time amplitude monitoring

// Configuration:
- Sample rate: 44.1kHz
- Channels: Mono
- Analysis window: 2048 samples
- Breathing frequency range: 20-1200 Hz
```

**AccelerometerBreathingDetector**
```typescript
// Features:
- Motion pattern analysis
- Baseline calibration (10 seconds)
- Peak detection for breathing cycles
- Gyroscope integration for stability
- Movement filtering and smoothing

// Configuration:
- Sample rate: 50Hz
- Window size: 250 samples (5 seconds)
- Breathing rate range: 8-30 BPM
- Movement threshold: 0.02G
```

**CameraBreathingDetector**
```typescript
// Features:
- Visual motion detection
- Region of interest analysis (chest area)
- Frame quality assessment
- Pixel difference calculation
- Real-time video processing

// Configuration:
- Frame rate: 30fps
- Analysis region: 60% x 40% (center-focused)
- Motion threshold: 5 pixels
- Buffer size: 150 frames (5 seconds)
```

#### 2. Multi-Sensor Fusion Engine

**MultiSensorBreathingDetector**
```typescript
// Fusion Strategies:
- Weighted Average: Combines all sensors with confidence weighting
- Highest Confidence: Selects best-performing sensor
- Majority Vote: Democratic decision across sensors
- Adaptive: Learns and adapts to best sensor for conditions

// Performance Tracking:
- Individual sensor confidence history
- Adaptive weight adjustment
- Sensor recommendation system
- Real-time performance analytics
```

#### 3. Enhanced Hook Integration

**useBreathingDetector (Extended)**
```typescript
// New Features:
- Sensor availability checking
- Multi-sensor configuration
- Fusion result access
- Real-time sensor switching
- Performance monitoring

// Usage:
const {
  breathingState,
  sensorAvailability,
  activeSensors,
  sensorFusionResult,
  checkSensorAvailability,
} = useBreathingDetector({
  enabledSensors: ['microphone', 'accelerometer'],
  sensorFusion: true,
  manualMode: false,
});
```

## 📱 **Sensor Capabilities**

### Microphone Detection
**How it works:**
- Records audio at high sample rate (44.1kHz)
- Applies FFT for frequency analysis
- Identifies breathing sounds in 20-1200Hz range
- Distinguishes inhale vs exhale patterns
- Filters out ambient noise

**Best for:**
- Quiet environments
- Conscious breathing exercises
- High-precision detection
- Users comfortable with audio recording

**Limitations:**
- Sensitive to background noise
- Requires microphone permission
- May not work in noisy environments

### Accelerometer Detection
**How it works:**
- Monitors device motion at 50Hz
- Requires phone placement on chest
- Calibrates baseline for 10 seconds
- Detects chest rise/fall patterns
- Uses gyroscope for stability compensation

**Best for:**
- Lying down exercises
- Meditation sessions
- Silent environments
- Users who can place phone on chest

**Limitations:**
- Requires specific phone placement
- Sensitive to external movement
- Needs calibration period

### Camera Detection
**How it works:**
- Processes video frames at 30fps
- Focuses on chest/shoulder region
- Calculates pixel differences between frames
- Tracks rhythmic movement patterns
- Assesses frame quality for reliability

**Best for:**
- Hands-free detection
- Sitting upright exercises
- Good lighting conditions
- Visual feedback preference

**Limitations:**
- Requires camera permission
- Sensitive to lighting changes
- Needs stable phone position
- Higher battery consumption

## 🔧 **Configuration Options**

### Sensor Selection
```typescript
const config = {
  enabledSensors: ['microphone', 'accelerometer', 'camera'],
  sensorFusion: true,
  fusionStrategy: 'weighted_average', // or 'highest_confidence', 'majority_vote', 'adaptive'
  manualMode: false, // Set to true for manual control
};
```

### Individual Sensor Tuning
```typescript
// Microphone settings
microphoneConfig: {
  sampleRate: 44100,
  breathingThreshold: 0.02,
  inhaleFrequencyRange: [20, 800],
  exhaleFrequencyRange: [50, 1200],
}

// Accelerometer settings
accelerometerConfig: {
  sampleRate: 50,
  movementThreshold: 0.02,
  calibrationTime: 10000,
  breathingFrequencyRange: [8, 30],
}

// Camera settings
cameraConfig: {
  frameRate: 30,
  motionThreshold: 5,
  analysisRegion: { x: 0.2, y: 0.3, width: 0.6, height: 0.4 },
}
```

### Fusion Parameters
```typescript
fusionConfig: {
  sensorWeights: {
    microphone: 0.4,
    accelerometer: 0.4,
    camera: 0.2,
  },
  confidenceThreshold: 0.6,
  adaptiveThreshold: 0.3,
  updateInterval: 200, // ms
}
```

## 🎮 **User Interface**

### Multi-Sensor Demo Screen
- **Sensor Selection**: Toggle individual sensors on/off
- **Mode Switching**: Manual vs automatic detection
- **Fusion Controls**: Enable/disable sensor fusion
- **Real-time Status**: Live sensor status and performance
- **Fusion Analytics**: Detailed sensor contribution analysis

### Enhanced Status Indicator
- **Multi-sensor Feedback**: Visual indication of active sensors
- **Confidence Display**: Real-time confidence scoring
- **Sensor Recommendations**: System suggestions for optimal sensors
- **Performance Metrics**: Historical sensor performance data

## 📊 **Performance Metrics**

### Accuracy Measurements
- **Individual Sensor Accuracy**: Per-sensor confidence tracking
- **Fusion Accuracy**: Combined system performance
- **Breathing Rate Precision**: BPM calculation accuracy
- **Phase Detection**: Inhale/exhale/pause classification accuracy

### Real-time Analytics
- **Sensor Contribution**: Live weight distribution
- **Performance History**: Rolling confidence averages
- **Recommendation Engine**: Adaptive sensor selection
- **Quality Assessment**: Frame/audio/motion quality scoring

## 🔐 **Privacy & Permissions**

### Required Permissions
**Android:**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**iOS:**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone to detect breathing patterns and provide personalized breathing exercises.</string>
<key>NSCameraUsageDescription</key>
<string>This app uses the camera to monitor subtle chest movements for breathing detection during exercises.</string>
```

### Privacy Features
- **Local Processing**: All analysis happens on-device
- **No Data Storage**: Audio/video not saved permanently
- **Permission Control**: Users can enable/disable individual sensors
- **Transparent Operation**: Clear indication of active sensors

## 🚀 **Usage Examples**

### Basic Multi-Sensor Setup
```typescript
const BreathingScreen = () => {
  const {
    breathingState,
    isDetecting,
    startDetection,
    sensorAvailability,
    activeSensors,
  } = useBreathingDetector({
    enabledSensors: ['microphone', 'accelerometer'],
    sensorFusion: true,
    manualMode: false,
  });

  useEffect(() => {
    checkSensorAvailability();
  }, []);

  const handleStart = async () => {
    const started = await startDetection();
    if (!started) {
      Alert.alert('Sensor Error', 'Failed to start detection');
    }
  };

  return (
    <View>
      <BreathingStatusIndicator breathingState={breathingState} />
      <Text>Active Sensors: {activeSensors.join(', ')}</Text>
      <Button title="Start Detection" onPress={handleStart} />
    </View>
  );
};
```

### Advanced Sensor Configuration
```typescript
const AdvancedBreathingScreen = () => {
  const [sensorConfig, setSensorConfig] = useState({
    enabledSensors: ['microphone'],
    fusionStrategy: 'adaptive',
    confidenceThreshold: 0.7,
  });

  const {
    breathingState,
    sensorFusionResult,
    multiSensorDetector,
  } = useBreathingDetector(sensorConfig);

  const handleConfigChange = (newConfig) => {
    setSensorConfig(prev => ({ ...prev, ...newConfig }));
    multiSensorDetector?.updateConfig(newConfig);
  };

  return (
    <View>
      <SensorConfigPanel 
        config={sensorConfig}
        onChange={handleConfigChange}
      />
      {sensorFusionResult && (
        <FusionAnalytics result={sensorFusionResult} />
      )}
    </View>
  );
};
```

## 🔧 **Troubleshooting**

### Common Issues

**Microphone Detection Not Working:**
- Check microphone permissions
- Ensure quiet environment
- Verify audio recording capability
- Try adjusting sensitivity threshold

**Accelerometer Detection Unstable:**
- Ensure phone is placed on chest
- Complete calibration period (10 seconds)
- Minimize external movement
- Check device orientation stability

**Camera Detection Poor Performance:**
- Ensure good lighting conditions
- Position camera to view chest area
- Minimize background movement
- Check camera permissions

**Sensor Fusion Issues:**
- Verify multiple sensors are available
- Check individual sensor performance
- Adjust fusion strategy
- Monitor confidence thresholds

### Performance Optimization
- Use appropriate sensor combinations for use case
- Adjust update intervals based on battery constraints
- Monitor confidence scores for quality assessment
- Implement fallback strategies for sensor failures

## 🔮 **Future Enhancements**

### Planned Features
- **Machine Learning**: Pattern recognition improvement
- **Bluetooth Sensors**: External device integration
- **Health Integration**: Apple Health/Google Fit connectivity
- **Advanced Analytics**: Long-term breathing pattern analysis
- **Personalization**: User-specific calibration and adaptation

### Research Areas
- **Signal Processing**: Advanced filtering algorithms
- **Computer Vision**: Improved motion detection
- **Sensor Fusion**: More sophisticated fusion strategies
- **Edge Computing**: On-device ML model optimization

---

This multi-sensor breathing detection system provides a robust, accurate, and user-friendly approach to breathing pattern analysis, suitable for meditation, breathing exercises, and health monitoring applications.