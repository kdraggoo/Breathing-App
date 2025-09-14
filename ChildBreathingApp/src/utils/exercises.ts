import { BreathingExercise } from '../types';

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: 'balloon-breathing',
    name: 'Balloon Breathing',
    description: 'Imagine you\'re blowing up a balloon! Take deep breaths to make it bigger and bigger.',
    duration: 60,
    instructions: [
      'Find a comfortable place to sit',
      'Imagine holding a small balloon',
      'Breathe in slowly to make it bigger',
      'Hold your breath for a moment',
      'Breathe out slowly to let the air out'
    ],
    visualType: 'balloon',
    color: '#FF6B6B'
  },
  {
    id: 'flower-breathing',
    name: 'Flower Breathing',
    description: 'Smell a beautiful flower! Take gentle breaths like you\'re smelling the sweetest flower.',
    duration: 90,
    instructions: [
      'Sit up straight and relax',
      'Imagine holding a beautiful flower',
      'Breathe in slowly through your nose',
      'Smell the sweet flower scent',
      'Breathe out gently through your mouth'
    ],
    visualType: 'flower',
    color: '#4ECDC4'
  },
  {
    id: 'rainbow-breathing',
    name: 'Rainbow Breathing',
    description: 'Follow the colors of the rainbow as you breathe! Each color helps you feel more calm.',
    duration: 120,
    instructions: [
      'Start with red - breathe in slowly',
      'Move to orange - hold your breath',
      'Continue to yellow - breathe out gently',
      'Follow green - breathe in again',
      'Complete with blue, indigo, and violet'
    ],
    visualType: 'rainbow',
    color: '#45B7D1'
  },
  {
    id: 'star-breathing',
    name: 'Star Breathing',
    description: 'Reach for the stars! Breathe in and out as you trace the points of a star.',
    duration: 75,
    instructions: [
      'Imagine a bright star in front of you',
      'Breathe in as you go up the first point',
      'Hold your breath at the top',
      'Breathe out as you go down',
      'Continue around all five points'
    ],
    visualType: 'star',
    color: '#96CEB4'
  }
];

export const EXERCISE_DURATIONS = [30, 60, 90, 120, 180]; // in seconds

export const getExerciseById = (id: string): BreathingExercise | undefined => {
  return BREATHING_EXERCISES.find(exercise => exercise.id === id);
};

export const getRandomExercise = (): BreathingExercise => {
  const randomIndex = Math.floor(Math.random() * BREATHING_EXERCISES.length);
  return BREATHING_EXERCISES[randomIndex];
};
