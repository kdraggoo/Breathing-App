import { useState, useEffect, useRef, useCallback } from 'react';
import { BreathingStatus, BreathingState, BreathingDetectorConfig } from '../types';
import MultiSensorBreathingDetector, { SensorType, SensorAvailability, FusedBreathingResult } from '../sensors/MultiSensorBreathingDetector';

interface ExtendedBreathingDetectorConfig extends BreathingDetectorConfig {
  enabledSensors: SensorType[];
  sensorFusion: boolean;
}

const DEFAULT_CONFIG: ExtendedBreathingDetectorConfig = {
  sensitivityThreshold: 0.3,
  pauseDetectionTime: 1000, // 1 second
  smoothingFactor: 0.7,
  manualMode: true, // Start with manual mode for better reliability
  enabledSensors: ['microphone', 'accelerometer'],
  sensorFusion: true,
};

export const useBreathingDetector = (config: Partial<ExtendedBreathingDetectorConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [breathingState, setBreathingState] = useState<BreathingState>({
    status: 'idle',
    intensity: 0,
    duration: 0,
    timestamp: Date.now(),
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [sensorAvailability, setSensorAvailability] = useState<SensorAvailability>({
    microphone: false,
    accelerometer: false,
    camera: false,
  });
  const [activeSensors, setActiveSensors] = useState<SensorType[]>([]);
  const [sensorFusionResult, setSensorFusionResult] = useState<FusedBreathingResult | null>(null);

  const stateStartTime = useRef<number>(Date.now());
  const lastUpdateTime = useRef<number>(Date.now());
  const smoothedIntensity = useRef<number>(0);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);
  const multiSensorDetector = useRef<MultiSensorBreathingDetector | null>(null);
  
  // Manual breathing detection methods
  const startBreathingIn = useCallback(() => {
    const now = Date.now();
    if (breathingState.status !== 'breathing_in') {
      stateStartTime.current = now;
      setBreathingState({
        status: 'breathing_in',
        intensity: 0.8,
        duration: 0,
        timestamp: now,
      });
    }
  }, [breathingState.status]);

  const startBreathingOut = useCallback(() => {
    const now = Date.now();
    if (breathingState.status !== 'breathing_out') {
      stateStartTime.current = now;
      setBreathingState({
        status: 'breathing_out',
        intensity: 0.8,
        duration: 0,
        timestamp: now,
      });
    }
  }, [breathingState.status]);

  const startPause = useCallback(() => {
    const now = Date.now();
    if (breathingState.status !== 'pausing') {
      stateStartTime.current = now;
      setBreathingState({
        status: 'pausing',
        intensity: 0.1,
        duration: 0,
        timestamp: now,
      });
    }
  }, [breathingState.status]);

  const stopDetection = useCallback(() => {
    const now = Date.now();
    setBreathingState({
      status: 'idle',
      intensity: 0,
      duration: 0,
      timestamp: now,
    });
    setIsDetecting(false);
    if (pauseTimer.current) {
      clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
    }
  }, []);

  // Initialize multi-sensor detector
  useEffect(() => {
    if (finalConfig.sensorFusion && !finalConfig.manualMode) {
      multiSensorDetector.current = new MultiSensorBreathingDetector({
        enabledSensors: finalConfig.enabledSensors,
        fusionStrategy: 'weighted_average',
        confidenceThreshold: finalConfig.sensitivityThreshold,
      });

      multiSensorDetector.current.setOnBreathingDetected((result: FusedBreathingResult) => {
        setSensorFusionResult(result);
        setActiveSensors(result.activeSensors);
        
        // Update breathing state from sensor fusion
        const now = Date.now();
        if (result.breathingState.status !== breathingState.status) {
          stateStartTime.current = now;
        }
        
        setBreathingState({
          ...result.breathingState,
          duration: now - stateStartTime.current,
        });
      });
    }

    return () => {
      if (multiSensorDetector.current) {
        multiSensorDetector.current.stopDetection();
      }
    };
  }, [finalConfig.sensorFusion, finalConfig.manualMode, finalConfig.enabledSensors]);

  const checkSensorAvailability = useCallback(async () => {
    if (multiSensorDetector.current) {
      const availability = await multiSensorDetector.current.checkSensorAvailability();
      setSensorAvailability(availability);
      return availability;
    }
    return sensorAvailability;
  }, [sensorAvailability]);

  const startDetection = useCallback(async () => {
    if (finalConfig.manualMode) {
      setIsDetecting(true);
      stateStartTime.current = Date.now();
      return true;
    }

    if (multiSensorDetector.current) {
      const started = await multiSensorDetector.current.startDetection();
      if (started) {
        setIsDetecting(true);
        stateStartTime.current = Date.now();
        return true;
      }
    }
    
    return false;
  }, [finalConfig.manualMode]);

  // Auto-detection based on patterns (for future sensor integration)
  const detectBreathingPattern = useCallback((intensity: number) => {
    const now = Date.now();
    // const deltaTime = now - lastUpdateTime.current;
    lastUpdateTime.current = now;

    // Smooth the intensity value
    smoothedIntensity.current = 
      smoothedIntensity.current * finalConfig.smoothingFactor + 
      intensity * (1 - finalConfig.smoothingFactor);

    const currentIntensity = smoothedIntensity.current;

    // Determine breathing state based on intensity changes
    let newStatus: BreathingStatus = breathingState.status;

    if (currentIntensity > finalConfig.sensitivityThreshold) {
      if (breathingState.status !== 'breathing_in') {
        newStatus = 'breathing_in';
      }
    } else if (currentIntensity < -finalConfig.sensitivityThreshold) {
      if (breathingState.status !== 'breathing_out') {
        newStatus = 'breathing_out';
      }
    } else {
      // Low intensity might indicate a pause
      if (Math.abs(currentIntensity) < finalConfig.sensitivityThreshold * 0.5) {
        if (pauseTimer.current) {
          clearTimeout(pauseTimer.current);
        }
        pauseTimer.current = setTimeout(() => {
          if (isDetecting) {
            setBreathingState(prev => ({
              ...prev,
              status: 'pausing',
              intensity: Math.abs(currentIntensity),
            }));
          }
        }, finalConfig.pauseDetectionTime);
      }
    }

    // Update state if status changed
    if (newStatus !== breathingState.status) {
      stateStartTime.current = now;
      setBreathingState({
        status: newStatus,
        intensity: Math.abs(currentIntensity),
        duration: 0,
        timestamp: now,
      });
    }
  }, [breathingState.status, finalConfig, isDetecting]);

  // Update duration continuously
  useEffect(() => {
    if (!isDetecting || breathingState.status === 'idle') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const duration = now - stateStartTime.current;
      
      setBreathingState(prev => ({
        ...prev,
        duration,
      }));
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isDetecting, breathingState.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pauseTimer.current) {
        clearTimeout(pauseTimer.current);
      }
    };
  }, []);

  return {
    breathingState,
    isDetecting,
    startDetection,
    stopDetection,
    startBreathingIn,
    startBreathingOut,
    startPause,
    detectBreathingPattern, // For future sensor integration
    config: finalConfig,
    // New sensor-related functionality
    sensorAvailability,
    activeSensors,
    sensorFusionResult,
    checkSensorAvailability,
    multiSensorDetector: multiSensorDetector.current,
  };
};

export default useBreathingDetector;