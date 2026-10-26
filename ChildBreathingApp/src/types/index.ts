export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  instructions: string[];
  visualType: 'balloon' | 'flower' | 'rainbow' | 'star' | 'dandelion';
  color: string;
}

export interface DandelionState {
  petalCount: number; // 0-40
  seedCount: number; // 0-40
  phase: 'inhale' | 'hold' | 'exhale';
  progress: number; // 0-1 within current phase
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
  soundVolume: number; // 0.0 to 1.0
  vibrationEnabled: boolean;
  defaultDuration: number;
  theme: 'light' | 'dark' | 'colorful';
}
