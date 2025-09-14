export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  instructions: string[];
  visualType: 'balloon' | 'flower' | 'rainbow' | 'star';
  color: string;
}

export interface ExerciseSession {
  exerciseId: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  duration: number;
}

export interface UserProgress {
  totalSessions: number;
  streak: number;
  lastSessionDate?: Date;
  completedExercises: string[];
  achievements: string[];
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultDuration: number;
  theme: 'light' | 'dark' | 'colorful';
}

// Breathing Status Types
export type BreathingStatus = 'breathing_in' | 'breathing_out' | 'pausing' | 'idle';

export interface BreathingState {
  status: BreathingStatus;
  intensity: number; // 0-1, representing the strength/depth of breathing
  duration: number; // how long in current state (milliseconds)
  timestamp: number;
}

export interface BreathingDetectorConfig {
  sensitivityThreshold: number; // 0-1, how sensitive the detection should be
  pauseDetectionTime: number; // milliseconds to wait before considering it a pause
  smoothingFactor: number; // 0-1, for smoothing sensor data
  manualMode: boolean; // whether to use manual controls instead of sensor detection
}
