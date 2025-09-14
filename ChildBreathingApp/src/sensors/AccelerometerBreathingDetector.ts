import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { BreathingStatus } from '../types';

export interface AccelerometerDetectorConfig {
  sampleRate: number; // Hz
  windowSize: number; // Number of samples for analysis
  movementThreshold: number; // Minimum movement to detect breathing
  breathingFrequencyRange: [number, number]; // Expected breathing frequency range (breaths per minute)
  smoothingFactor: number; // For noise reduction
  calibrationTime: number; // Time to calibrate baseline (ms)
  positionTolerance: number; // How much position change is allowed
}

export interface MotionAnalysisResult {
  breathingRate: number; // Breaths per minute
  breathingType: BreathingStatus;
  confidence: number;
  movement: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };
  isCalibrated: boolean;
}

const DEFAULT_CONFIG: AccelerometerDetectorConfig = {
  sampleRate: 50, // 50 Hz
  windowSize: 250, // 5 seconds of data at 50Hz
  movementThreshold: 0.02, // Minimum G-force change
  breathingFrequencyRange: [8, 30], // 8-30 breaths per minute
  smoothingFactor: 0.8,
  calibrationTime: 10000, // 10 seconds
  positionTolerance: 0.1,
};

export class AccelerometerBreathingDetector {
  private config: AccelerometerDetectorConfig;
  private accelerometerSubscription?: Subscription;
  private gyroscopeSubscription?: Subscription;
  private isDetecting = false;
  private isCalibrated = false;
  private calibrationStartTime = 0;
  
  private baselineAcceleration = { x: 0, y: 0, z: 0 };
  private smoothedAcceleration = { x: 0, y: 0, z: 0 };
  private movementBuffer: Array<{ x: number; y: number; z: number; timestamp: number }> = [];
  
  private onBreathingDetected?: (result: MotionAnalysisResult) => void;
  private breathingHistory: MotionAnalysisResult[] = [];

  constructor(config: Partial<AccelerometerDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupSensorUpdateRates();
  }

  private setupSensorUpdateRates() {
    const updateInterval = 1000 / this.config.sampleRate; // Convert Hz to ms
    setUpdateIntervalForType(SensorTypes.accelerometer, updateInterval);
    setUpdateIntervalForType(SensorTypes.gyroscope, updateInterval);
  }

  setOnBreathingDetected(callback: (result: MotionAnalysisResult) => void) {
    this.onBreathingDetected = callback;
  }

  startDetection(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.isDetecting = true;
        this.isCalibrated = false;
        this.calibrationStartTime = Date.now();
        this.movementBuffer = [];

        // Start accelerometer monitoring
        this.accelerometerSubscription = accelerometer
          .pipe(
            map(({ x, y, z }) => ({
              x: parseFloat(x.toFixed(4)),
              y: parseFloat(y.toFixed(4)),
              z: parseFloat(z.toFixed(4)),
              timestamp: Date.now(),
            })),
            filter(() => this.isDetecting)
          )
          .subscribe(
            (data) => this.processAccelerometerData(data),
            (error) => {
              console.error('Accelerometer error:', error);
              resolve(false);
            }
          );

        // Start gyroscope monitoring for device orientation changes
        this.gyroscopeSubscription = gyroscope
          .pipe(
            map(({ x, y, z }) => ({
              x: parseFloat(x.toFixed(4)),
              y: parseFloat(y.toFixed(4)),
              z: parseFloat(z.toFixed(4)),
              timestamp: Date.now(),
            })),
            filter(() => this.isDetecting)
          )
          .subscribe(
            (data) => this.processGyroscopeData(data),
            (error) => {
              console.warn('Gyroscope error:', error);
              // Gyroscope is optional, don't fail if it's not available
            }
          );

        resolve(true);
      } catch (error) {
        console.error('Failed to start motion detection:', error);
        resolve(false);
      }
    });
  }

  stopDetection() {
    this.isDetecting = false;
    this.isCalibrated = false;
    
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.unsubscribe();
      this.accelerometerSubscription = undefined;
    }
    
    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.unsubscribe();
      this.gyroscopeSubscription = undefined;
    }
    
    this.movementBuffer = [];
    this.breathingHistory = [];
  }

  private processAccelerometerData(data: { x: number; y: number; z: number; timestamp: number }) {
    // Apply smoothing to reduce noise
    this.smoothedAcceleration.x = this.smoothedAcceleration.x * this.config.smoothingFactor + 
                                  data.x * (1 - this.config.smoothingFactor);
    this.smoothedAcceleration.y = this.smoothedAcceleration.y * this.config.smoothingFactor + 
                                  data.y * (1 - this.config.smoothingFactor);
    this.smoothedAcceleration.z = this.smoothedAcceleration.z * this.config.smoothingFactor + 
                                  data.z * (1 - this.config.smoothingFactor);

    // Calibration phase
    if (!this.isCalibrated) {
      this.calibrateBaseline(this.smoothedAcceleration, data.timestamp);
      return;
    }

    // Add to movement buffer
    this.movementBuffer.push({
      x: this.smoothedAcceleration.x - this.baselineAcceleration.x,
      y: this.smoothedAcceleration.y - this.baselineAcceleration.y,
      z: this.smoothedAcceleration.z - this.baselineAcceleration.z,
      timestamp: data.timestamp,
    });

    // Maintain buffer size
    if (this.movementBuffer.length > this.config.windowSize) {
      this.movementBuffer.shift();
    }

    // Analyze breathing if we have enough data
    if (this.movementBuffer.length >= this.config.windowSize) {
      this.analyzeBreathingPattern();
    }
  }

  private processGyroscopeData(data: { x: number; y: number; z: number; timestamp: number }) {
    // Use gyroscope data to detect significant device movement
    // If device is moving too much, reduce confidence in breathing detection
    const rotationMagnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    
    // If there's significant rotation, the device might not be stable enough for accurate detection
    if (rotationMagnitude > 1.0) { // Threshold for significant movement
      // Could adjust confidence or pause detection temporarily
    }
  }

  private calibrateBaseline(acceleration: { x: number; y: number; z: number }, timestamp: number) {
    const calibrationDuration = timestamp - this.calibrationStartTime;
    
    if (calibrationDuration < this.config.calibrationTime) {
      // Update running average of baseline
      const weight = calibrationDuration / this.config.calibrationTime;
      this.baselineAcceleration.x = this.baselineAcceleration.x * (1 - weight) + acceleration.x * weight;
      this.baselineAcceleration.y = this.baselineAcceleration.y * (1 - weight) + acceleration.y * weight;
      this.baselineAcceleration.z = this.baselineAcceleration.z * (1 - weight) + acceleration.z * weight;
    } else {
      this.isCalibrated = true;
      console.log('Accelerometer calibration complete:', this.baselineAcceleration);
    }
  }

  private analyzeBreathingPattern() {
    if (this.movementBuffer.length < this.config.windowSize) return;

    // Calculate movement magnitude for each sample
    const movements = this.movementBuffer.map(sample => ({
      magnitude: Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z),
      timestamp: sample.timestamp,
    }));

    // Find breathing peaks using simple peak detection
    const peaks = this.findBreathingPeaks(movements);
    const breathingRate = this.calculateBreathingRate(peaks);
    
    // Determine breathing phase based on recent movement trend
    const recentMovements = movements.slice(-10); // Last 10 samples
    const breathingType = this.determineBreathingPhase(recentMovements);
    
    // Calculate confidence based on pattern regularity and signal strength
    const confidence = this.calculateConfidence(movements, peaks, breathingRate);
    
    const currentMovement = movements[movements.length - 1];
    
    const result: MotionAnalysisResult = {
      breathingRate,
      breathingType,
      confidence,
      movement: {
        x: this.movementBuffer[this.movementBuffer.length - 1].x,
        y: this.movementBuffer[this.movementBuffer.length - 1].y,
        z: this.movementBuffer[this.movementBuffer.length - 1].z,
        magnitude: currentMovement.magnitude,
      },
      isCalibrated: this.isCalibrated,
    };

    // Store in history
    this.breathingHistory.push(result);
    if (this.breathingHistory.length > 100) {
      this.breathingHistory.shift();
    }

    // Notify callback
    if (this.onBreathingDetected) {
      this.onBreathingDetected(result);
    }
  }

  private findBreathingPeaks(movements: Array<{ magnitude: number; timestamp: number }>): number[] {
    const peaks: number[] = [];
    const threshold = this.config.movementThreshold;
    
    for (let i = 1; i < movements.length - 1; i++) {
      const current = movements[i].magnitude;
      const previous = movements[i - 1].magnitude;
      const next = movements[i + 1].magnitude;
      
      // Simple peak detection: current value is higher than neighbors and above threshold
      if (current > previous && current > next && current > threshold) {
        peaks.push(movements[i].timestamp);
      }
    }
    
    return peaks;
  }

  private calculateBreathingRate(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    
    // Calculate average time between peaks
    let totalInterval = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalInterval += peaks[i] - peaks[i - 1];
    }
    
    const averageInterval = totalInterval / (peaks.length - 1); // in milliseconds
    const breathingRate = (60 * 1000) / averageInterval; // Convert to breaths per minute
    
    // Clamp to reasonable range
    return Math.max(this.config.breathingFrequencyRange[0], 
                   Math.min(this.config.breathingFrequencyRange[1], breathingRate));
  }

  private determineBreathingPhase(recentMovements: Array<{ magnitude: number; timestamp: number }>): BreathingStatus {
    if (recentMovements.length < 3) return 'idle';
    
    const recent = recentMovements.slice(-3);
    const magnitudes = recent.map(m => m.magnitude);
    
    // Simple trend analysis
    const trend = magnitudes[2] - magnitudes[0];
    const currentMagnitude = magnitudes[2];
    
    if (currentMagnitude < this.config.movementThreshold * 0.5) {
      return 'idle';
    }
    
    if (trend > this.config.movementThreshold * 0.1) {
      return 'breathing_in'; // Increasing movement suggests inhale
    } else if (trend < -this.config.movementThreshold * 0.1) {
      return 'breathing_out'; // Decreasing movement suggests exhale
    } else {
      return 'pausing'; // Stable movement suggests holding breath
    }
  }

  private calculateConfidence(
    movements: Array<{ magnitude: number; timestamp: number }>,
    peaks: number[],
    breathingRate: number
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Check if breathing rate is in expected range
    if (breathingRate >= this.config.breathingFrequencyRange[0] && 
        breathingRate <= this.config.breathingFrequencyRange[1]) {
      confidence += 0.2;
    }
    
    // Check signal strength
    const averageMagnitude = movements.reduce((sum, m) => sum + m.magnitude, 0) / movements.length;
    if (averageMagnitude > this.config.movementThreshold) {
      confidence += 0.2;
    }
    
    // Check pattern regularity (more peaks = more regular breathing)
    const expectedPeaks = (movements.length / this.config.sampleRate) * (breathingRate / 60);
    const peakRegularity = Math.min(1, peaks.length / Math.max(1, expectedPeaks));
    confidence += peakRegularity * 0.1;
    
    return Math.min(1, Math.max(0, confidence));
  }

  getBreathingHistory(): MotionAnalysisResult[] {
    return [...this.breathingHistory];
  }

  getConfig(): AccelerometerDetectorConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AccelerometerDetectorConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.setupSensorUpdateRates();
  }

  isCalibrating(): boolean {
    return !this.isCalibrated && this.isDetecting;
  }

  getCalibrationProgress(): number {
    if (!this.isDetecting || this.isCalibrated) return 1;
    
    const elapsed = Date.now() - this.calibrationStartTime;
    return Math.min(1, elapsed / this.config.calibrationTime);
  }
}

export default AccelerometerBreathingDetector;