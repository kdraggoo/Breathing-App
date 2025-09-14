import AudioRecord from 'react-native-audio-record';
import { PermissionsAndroid, Platform } from 'react-native';
import { BreathingStatus } from '../types';

export interface MicrophoneDetectorConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  audioSource: number;
  bufferSize: number;
  analysisWindowSize: number; // Number of samples to analyze
  breathingThreshold: number; // Amplitude threshold for breathing detection
  silenceThreshold: number; // Threshold for silence detection
  inhaleFrequencyRange: [number, number]; // Frequency range for inhale sounds
  exhaleFrequencyRange: [number, number]; // Frequency range for exhale sounds
}

export interface AudioAnalysisResult {
  amplitude: number;
  frequency: number;
  isBreathing: boolean;
  breathingType: BreathingStatus;
  confidence: number;
}

const DEFAULT_CONFIG: MicrophoneDetectorConfig = {
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6, // VOICE_RECOGNITION
  bufferSize: 4096,
  analysisWindowSize: 2048,
  breathingThreshold: 0.02, // Minimum amplitude for breathing
  silenceThreshold: 0.005, // Threshold for silence
  inhaleFrequencyRange: [20, 800], // Hz range for inhale sounds
  exhaleFrequencyRange: [50, 1200], // Hz range for exhale sounds
};

export class MicrophoneBreathingDetector {
  private config: MicrophoneDetectorConfig;
  private isRecording = false;
  private audioBuffer: number[] = [];
  private lastAnalysisTime = 0;
  private breathingHistory: AudioAnalysisResult[] = [];
  private onBreathingDetected?: (result: AudioAnalysisResult) => void;

  constructor(config: Partial<MicrophoneDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAudioRecord();
  }

  private initializeAudioRecord() {
    const options = {
      sampleRate: this.config.sampleRate,
      channels: this.config.channels,
      bitsPerSample: this.config.bitsPerSample,
      audioSource: this.config.audioSource,
      wavFile: 'breathing_analysis.wav',
    };

    AudioRecord.init(options);
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to detect breathing patterns.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request failed:', err);
        return false;
      }
    }
    return true; // iOS permissions handled in Info.plist
  }

  setOnBreathingDetected(callback: (result: AudioAnalysisResult) => void) {
    this.onBreathingDetected = callback;
  }

  async startDetection(): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Microphone permission not granted');
      return false;
    }

    try {
      AudioRecord.start();
      this.isRecording = true;
      this.startAnalysis();
      return true;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      return false;
    }
  }

  stopDetection() {
    if (this.isRecording) {
      AudioRecord.stop();
      this.isRecording = false;
      this.audioBuffer = [];
    }
  }

  private startAnalysis() {
    const analyzeAudio = () => {
      if (!this.isRecording) return;

      // Get audio data (this is a simplified approach - in real implementation,
      // you'd need to process the actual audio buffer from the recording)
      this.processAudioBuffer();

      // Continue analysis
      setTimeout(analyzeAudio, 100); // Analyze every 100ms
    };

    analyzeAudio();
  }

  private processAudioBuffer() {
    // In a real implementation, you would:
    // 1. Get the actual audio buffer from AudioRecord
    // 2. Apply FFT to get frequency domain data
    // 3. Analyze amplitude and frequency characteristics
    // 4. Classify breathing patterns

    // For now, we'll simulate the analysis
    const simulatedAnalysis = this.simulateBreathingAnalysis();
    
    if (this.onBreathingDetected) {
      this.onBreathingDetected(simulatedAnalysis);
    }

    // Store in history for pattern analysis
    this.breathingHistory.push(simulatedAnalysis);
    if (this.breathingHistory.length > 100) {
      this.breathingHistory.shift(); // Keep only recent history
    }
  }

  private simulateBreathingAnalysis(): AudioAnalysisResult {
    // This is a simplified simulation - in a real implementation, you would:
    // 1. Calculate RMS amplitude from audio samples
    // 2. Perform FFT to get frequency spectrum
    // 3. Analyze breathing patterns based on audio characteristics

    const now = Date.now();
    // const timeDiff = now - this.lastAnalysisTime;
    this.lastAnalysisTime = now;

    // Simulate varying amplitude and frequency
    const baseAmplitude = 0.01 + Math.random() * 0.05;
    const baseFrequency = 100 + Math.random() * 500;

    // Simple pattern detection based on time and amplitude
    const breathingCyclePosition = (now / 4000) % 1; // 4-second breathing cycle
    
    let breathingType: BreathingStatus = 'idle';
    let amplitude = baseAmplitude;
    let confidence = 0.5;

    if (breathingCyclePosition < 0.4) {
      // Inhale phase
      breathingType = 'breathing_in';
      amplitude = baseAmplitude * (1 + breathingCyclePosition * 2);
      confidence = 0.7 + Math.random() * 0.2;
    } else if (breathingCyclePosition < 0.6) {
      // Hold phase
      breathingType = 'pausing';
      amplitude = baseAmplitude * 0.3;
      confidence = 0.6 + Math.random() * 0.2;
    } else {
      // Exhale phase
      breathingType = 'breathing_out';
      amplitude = baseAmplitude * (1 + (1 - breathingCyclePosition) * 2);
      confidence = 0.7 + Math.random() * 0.2;
    }

    const isBreathing = amplitude > this.config.silenceThreshold;

    return {
      amplitude,
      frequency: baseFrequency,
      isBreathing,
      breathingType: isBreathing ? breathingType : 'idle',
      confidence,
    };
  }

  // Real audio analysis methods (would be implemented with actual audio processing)
  private calculateRMSAmplitude(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  private performFFT(samples: Float32Array): Float32Array {
    // In a real implementation, you would use a proper FFT library
    // This is a placeholder for frequency domain analysis
    return new Float32Array(samples.length / 2);
  }

  private analyzeBreathingFrequencies(frequencyData: Float32Array): {
    inhaleStrength: number;
    exhaleStrength: number;
  } {
    const sampleRate = this.config.sampleRate;
    const binSize = sampleRate / frequencyData.length;
    
    let inhaleStrength = 0;
    let exhaleStrength = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * binSize;
      const magnitude = frequencyData[i];
      
      if (frequency >= this.config.inhaleFrequencyRange[0] && 
          frequency <= this.config.inhaleFrequencyRange[1]) {
        inhaleStrength += magnitude;
      }
      
      if (frequency >= this.config.exhaleFrequencyRange[0] && 
          frequency <= this.config.exhaleFrequencyRange[1]) {
        exhaleStrength += magnitude;
      }
    }
    
    return { inhaleStrength, exhaleStrength };
  }

  getBreathingHistory(): AudioAnalysisResult[] {
    return [...this.breathingHistory];
  }

  getConfig(): MicrophoneDetectorConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<MicrophoneDetectorConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export default MicrophoneBreathingDetector;