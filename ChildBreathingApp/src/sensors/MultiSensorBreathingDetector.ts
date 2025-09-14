import { BreathingStatus, BreathingState } from '../types';
import MicrophoneBreathingDetector, { AudioAnalysisResult } from './MicrophoneBreathingDetector';
import AccelerometerBreathingDetector, { MotionAnalysisResult } from './AccelerometerBreathingDetector';
import CameraBreathingDetector, { FrameAnalysisResult } from './CameraBreathingDetector';

export type SensorType = 'microphone' | 'accelerometer' | 'camera' | 'fusion';

export interface SensorAvailability {
  microphone: boolean;
  accelerometer: boolean;
  camera: boolean;
}

export interface MultiSensorConfig {
  enabledSensors: SensorType[];
  fusionStrategy: 'weighted_average' | 'highest_confidence' | 'majority_vote' | 'adaptive';
  sensorWeights: {
    microphone: number;
    accelerometer: number;
    camera: number;
  };
  confidenceThreshold: number;
  adaptiveThreshold: number; // For switching between sensors based on performance
  updateInterval: number; // ms
}

export interface FusedBreathingResult {
  breathingState: BreathingState;
  sensorContributions: {
    microphone?: { result: AudioAnalysisResult; weight: number };
    accelerometer?: { result: MotionAnalysisResult; weight: number };
    camera?: { result: FrameAnalysisResult; weight: number };
  };
  fusionConfidence: number;
  activeSensors: SensorType[];
  recommendedSensor: SensorType;
}

const DEFAULT_CONFIG: MultiSensorConfig = {
  enabledSensors: ['microphone', 'accelerometer'],
  fusionStrategy: 'weighted_average',
  sensorWeights: {
    microphone: 0.4,
    accelerometer: 0.4,
    camera: 0.2,
  },
  confidenceThreshold: 0.6,
  adaptiveThreshold: 0.3,
  updateInterval: 200, // 200ms
};

export class MultiSensorBreathingDetector {
  private config: MultiSensorConfig;
  private microphoneDetector?: MicrophoneBreathingDetector;
  private accelerometerDetector?: AccelerometerBreathingDetector;
  private cameraDetector?: CameraBreathingDetector;
  
  private isDetecting = false;
  private sensorAvailability: SensorAvailability = {
    microphone: false,
    accelerometer: false,
    camera: false,
  };
  
  private latestResults: {
    microphone?: AudioAnalysisResult;
    accelerometer?: MotionAnalysisResult;
    camera?: FrameAnalysisResult;
  } = {};
  
  private sensorPerformance: {
    microphone: number[];
    accelerometer: number[];
    camera: number[];
  } = {
    microphone: [],
    accelerometer: [],
    camera: [],
  };
  
  private onBreathingDetected?: (result: FusedBreathingResult) => void;
  private fusionHistory: FusedBreathingResult[] = [];
  private updateTimer?: NodeJS.Timeout;

  constructor(config: Partial<MultiSensorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeSensors();
  }

  private initializeSensors() {
    // Initialize enabled sensors
    if (this.config.enabledSensors.includes('microphone')) {
      this.microphoneDetector = new MicrophoneBreathingDetector();
      this.microphoneDetector.setOnBreathingDetected((result) => {
        this.latestResults.microphone = result;
        this.updateSensorPerformance('microphone', result.confidence);
      });
    }
    
    if (this.config.enabledSensors.includes('accelerometer')) {
      this.accelerometerDetector = new AccelerometerBreathingDetector();
      this.accelerometerDetector.setOnBreathingDetected((result) => {
        this.latestResults.accelerometer = result;
        this.updateSensorPerformance('accelerometer', result.confidence);
      });
    }
    
    if (this.config.enabledSensors.includes('camera')) {
      this.cameraDetector = new CameraBreathingDetector();
      this.cameraDetector.setOnBreathingDetected((result) => {
        this.latestResults.camera = result;
        this.updateSensorPerformance('camera', result.confidence);
      });
    }
  }

  setOnBreathingDetected(callback: (result: FusedBreathingResult) => void) {
    this.onBreathingDetected = callback;
  }

  async checkSensorAvailability(): Promise<SensorAvailability> {
    const availability: SensorAvailability = {
      microphone: false,
      accelerometer: false,
      camera: false,
    };

    // Check microphone
    if (this.microphoneDetector) {
      try {
        availability.microphone = await this.microphoneDetector.requestPermissions();
      } catch (error) {
        console.warn('Microphone availability check failed:', error);
      }
    }

    // Check accelerometer (usually always available)
    if (this.accelerometerDetector) {
      availability.accelerometer = true; // Accelerometer is typically always available
    }

    // Check camera
    if (this.cameraDetector) {
      try {
        availability.camera = await this.cameraDetector.requestPermissions();
      } catch (error) {
        console.warn('Camera availability check failed:', error);
      }
    }

    this.sensorAvailability = availability;
    return availability;
  }

  async startDetection(): Promise<boolean> {
    if (this.isDetecting) return true;

    // Check sensor availability
    await this.checkSensorAvailability();

    let startedSensors = 0;
    // const totalSensors = this.config.enabledSensors.length;

    // Start enabled and available sensors
    if (this.config.enabledSensors.includes('microphone') && 
        this.sensorAvailability.microphone && 
        this.microphoneDetector) {
      try {
        const started = await this.microphoneDetector.startDetection();
        if (started) startedSensors++;
      } catch (error) {
        console.error('Failed to start microphone detection:', error);
      }
    }

    if (this.config.enabledSensors.includes('accelerometer') && 
        this.sensorAvailability.accelerometer && 
        this.accelerometerDetector) {
      try {
        const started = await this.accelerometerDetector.startDetection();
        if (started) startedSensors++;
      } catch (error) {
        console.error('Failed to start accelerometer detection:', error);
      }
    }

    if (this.config.enabledSensors.includes('camera') && 
        this.sensorAvailability.camera && 
        this.cameraDetector) {
      try {
        const started = this.cameraDetector.startDetection();
        if (started) startedSensors++;
      } catch (error) {
        console.error('Failed to start camera detection:', error);
      }
    }

    if (startedSensors > 0) {
      this.isDetecting = true;
      this.startFusionProcess();
      return true;
    }

    return false;
  }

  stopDetection() {
    this.isDetecting = false;

    // Stop all sensors
    if (this.microphoneDetector) {
      this.microphoneDetector.stopDetection();
    }
    if (this.accelerometerDetector) {
      this.accelerometerDetector.stopDetection();
    }
    if (this.cameraDetector) {
      this.cameraDetector.stopDetection();
    }

    // Clear fusion timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    // Clear results
    this.latestResults = {};
  }

  private startFusionProcess() {
    this.updateTimer = setInterval(() => {
      if (this.isDetecting) {
        this.performSensorFusion();
      }
    }, this.config.updateInterval);
  }

  private performSensorFusion() {
    const activeSensors: SensorType[] = [];
    const sensorContributions: FusedBreathingResult['sensorContributions'] = {};

    // Collect active sensor data
    if (this.latestResults.microphone) {
      activeSensors.push('microphone');
      sensorContributions.microphone = {
        result: this.latestResults.microphone,
        weight: this.config.sensorWeights.microphone,
      };
    }

    if (this.latestResults.accelerometer) {
      activeSensors.push('accelerometer');
      sensorContributions.accelerometer = {
        result: this.latestResults.accelerometer,
        weight: this.config.sensorWeights.accelerometer,
      };
    }

    if (this.latestResults.camera) {
      activeSensors.push('camera');
      sensorContributions.camera = {
        result: this.latestResults.camera,
        weight: this.config.sensorWeights.camera,
      };
    }

    if (activeSensors.length === 0) return;

    // Apply fusion strategy
    const fusedResult = this.applyFusionStrategy(sensorContributions);
    const recommendedSensor = this.getRecommendedSensor();

    const result: FusedBreathingResult = {
      breathingState: fusedResult,
      sensorContributions,
      fusionConfidence: this.calculateFusionConfidence(sensorContributions),
      activeSensors,
      recommendedSensor,
    };

    // Store in history
    this.fusionHistory.push(result);
    if (this.fusionHistory.length > 100) {
      this.fusionHistory.shift();
    }

    // Notify callback
    if (this.onBreathingDetected) {
      this.onBreathingDetected(result);
    }
  }

  private applyFusionStrategy(contributions: FusedBreathingResult['sensorContributions']): BreathingState {
    switch (this.config.fusionStrategy) {
      case 'weighted_average':
        return this.weightedAverageFusion(contributions);
      case 'highest_confidence':
        return this.highestConfidenceFusion(contributions);
      case 'majority_vote':
        return this.majorityVoteFusion(contributions);
      case 'adaptive':
        return this.adaptiveFusion(contributions);
      default:
        return this.weightedAverageFusion(contributions);
    }
  }

  private weightedAverageFusion(contributions: FusedBreathingResult['sensorContributions']): BreathingState {
    let totalWeight = 0;
    let weightedIntensity = 0;
    const statusVotes: { [key in BreathingStatus]: number } = {
      breathing_in: 0,
      breathing_out: 0,
      pausing: 0,
      idle: 0,
    };

    // Collect weighted votes
    Object.entries(contributions).forEach(([_sensor, data]) => {
      if (data) {
        const weight = data.weight;
        totalWeight += weight;
        
        // Get breathing status from sensor result
        let status: BreathingStatus = 'idle';
        let intensity = 0;
        
        if ('breathingType' in data.result) {
          // Microphone, camera, or accelerometer result
          status = data.result.breathingType;
          intensity = data.result.confidence;
        }
        
        statusVotes[status] += weight;
        weightedIntensity += intensity * weight;
      }
    });

    // Find winning status
    const winningStatus = Object.entries(statusVotes).reduce((a, b) => 
      statusVotes[a[0] as BreathingStatus] > statusVotes[b[0] as BreathingStatus] ? a : b
    )[0] as BreathingStatus;

    const averageIntensity = totalWeight > 0 ? weightedIntensity / totalWeight : 0;

    return {
      status: winningStatus,
      intensity: averageIntensity,
      duration: 0, // Will be calculated by the main detector
      timestamp: Date.now(),
    };
  }

  private highestConfidenceFusion(contributions: FusedBreathingResult['sensorContributions']): BreathingState {
    let bestResult: any = null;
    let bestConfidence = 0;

    Object.values(contributions).forEach(data => {
      if (data && data.result.confidence > bestConfidence) {
        bestConfidence = data.result.confidence;
        bestResult = data.result;
      }
    });

    if (!bestResult) {
      return {
        status: 'idle',
        intensity: 0,
        duration: 0,
        timestamp: Date.now(),
      };
    }

    return {
      status: bestResult.breathingType || 'idle',
      intensity: bestResult.confidence,
      duration: 0,
      timestamp: Date.now(),
    };
  }

  private majorityVoteFusion(contributions: FusedBreathingResult['sensorContributions']): BreathingState {
    const votes: { [key in BreathingStatus]: number } = {
      breathing_in: 0,
      breathing_out: 0,
      pausing: 0,
      idle: 0,
    };

    let totalIntensity = 0;
    let sensorCount = 0;

    Object.values(contributions).forEach(data => {
      if (data) {
        const status = data.result.breathingType || 'idle';
        votes[status]++;
        totalIntensity += data.result.confidence;
        sensorCount++;
      }
    });

    const winningStatus = Object.entries(votes).reduce((a, b) => 
      votes[a[0] as BreathingStatus] > votes[b[0] as BreathingStatus] ? a : b
    )[0] as BreathingStatus;

    return {
      status: winningStatus,
      intensity: sensorCount > 0 ? totalIntensity / sensorCount : 0,
      duration: 0,
      timestamp: Date.now(),
    };
  }

  private adaptiveFusion(contributions: FusedBreathingResult['sensorContributions']): BreathingState {
    // Use the sensor with the best recent performance
    const bestSensor = this.getBestPerformingSensor();
    
    if (bestSensor && contributions[bestSensor]) {
      const result = contributions[bestSensor]!.result;
      return {
        status: result.breathingType || 'idle',
        intensity: result.confidence,
        duration: 0,
        timestamp: Date.now(),
      };
    }

    // Fall back to weighted average
    return this.weightedAverageFusion(contributions);
  }

  private calculateFusionConfidence(contributions: FusedBreathingResult['sensorContributions']): number {
    let totalConfidence = 0;
    let totalWeight = 0;

    Object.values(contributions).forEach(data => {
      if (data) {
        totalConfidence += data.result.confidence * data.weight;
        totalWeight += data.weight;
      }
    });

    return totalWeight > 0 ? totalConfidence / totalWeight : 0;
  }

  private updateSensorPerformance(sensor: keyof typeof this.sensorPerformance, confidence: number) {
    this.sensorPerformance[sensor].push(confidence);
    
    // Keep only recent performance data
    if (this.sensorPerformance[sensor].length > 50) {
      this.sensorPerformance[sensor].shift();
    }
  }

  private getBestPerformingSensor(): SensorType | null {
    let bestSensor: SensorType | null = null;
    let bestAverage = 0;

    (['microphone', 'accelerometer', 'camera'] as const).forEach((_sensor) => {
      const sensor = _sensor;
      const performance = this.sensorPerformance[sensor];
      if (performance.length > 5) {
        const average = performance.reduce((sum, val) => sum + val, 0) / performance.length;
        if (average > bestAverage) {
          bestAverage = average;
          bestSensor = sensor;
        }
      }
    });

    return bestSensor;
  }

  private getRecommendedSensor(): SensorType {
    // Recommend sensor based on current conditions and performance
    const bestSensor = this.getBestPerformingSensor();
    if (bestSensor) return bestSensor;

    // Default recommendations based on sensor availability
    if (this.sensorAvailability.microphone) return 'microphone';
    if (this.sensorAvailability.accelerometer) return 'accelerometer';
    if (this.sensorAvailability.camera) return 'camera';

    return 'fusion';
  }

  getSensorAvailability(): SensorAvailability {
    return { ...this.sensorAvailability };
  }

  getSensorPerformance(): typeof this.sensorPerformance {
    return {
      microphone: [...this.sensorPerformance.microphone],
      accelerometer: [...this.sensorPerformance.accelerometer],
      camera: [...this.sensorPerformance.camera],
    };
  }

  getFusionHistory(): FusedBreathingResult[] {
    return [...this.fusionHistory];
  }

  getConfig(): MultiSensorConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<MultiSensorConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize sensors if enabled sensors changed
    if (newConfig.enabledSensors) {
      this.stopDetection();
      this.initializeSensors();
    }
  }

  // Individual sensor accessors
  getMicrophoneDetector(): MicrophoneBreathingDetector | undefined {
    return this.microphoneDetector;
  }

  getAccelerometerDetector(): AccelerometerBreathingDetector | undefined {
    return this.accelerometerDetector;
  }

  getCameraDetector(): CameraBreathingDetector | undefined {
    return this.cameraDetector;
  }
}

export default MultiSensorBreathingDetector;