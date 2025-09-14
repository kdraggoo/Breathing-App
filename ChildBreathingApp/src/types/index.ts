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
