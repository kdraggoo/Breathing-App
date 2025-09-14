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

export interface PhysicsObject {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  mass: number;
  isAffectedByBreathing: boolean;
  breathingForceMultiplier: number;
  dragCoefficient: number;
  maxSpeed: number;
  visualType: 'particle' | 'bubble' | 'leaf' | 'feather' | 'sparkle';
  color: string;
  size: number;
}

export interface BreathingPhysicsState {
  isActive: boolean;
  currentPhase: 'inhale' | 'hold' | 'exhale';
  phaseProgress: number; // 0-1
  forceStrength: number;
  userPosition: { x: number; y: number };
}

export interface PhysicsEngineConfig {
  maxObjects: number;
  spawnRate: number;
  baseForceStrength: number;
  maxForceDistance: number;
  gravityStrength: number;
  airResistance: number;
}
