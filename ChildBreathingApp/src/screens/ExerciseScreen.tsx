import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getExerciseById } from '../utils/exercises';
import { BreathingExercise } from '../types';
import PhysicsLayer from '../components/PhysicsLayer';

const { width, height } = Dimensions.get('window');

const ExerciseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exerciseId } = route.params as { exerciseId: string };
  
  const exercise = getExerciseById(exerciseId);
  
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeRemaining, setTimeRemaining] = useState(exercise?.duration || 60);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [enablePhysics, setEnablePhysics] = useState(true);
  
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      startBreathingCycle();
    } else {
      stopBreathingCycle();
    }
  }, [isActive]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsActive(false);
      // Exercise completed - could add completion celebration here
    }
  }, [timeRemaining]);

  const startBreathingCycle = () => {
    const inhaleTime = 4000;
    const holdTime = 2000;
    const exhaleTime = 4000;
    const totalCycleTime = inhaleTime + holdTime + exhaleTime;

    const updatePhaseProgress = (phase: 'inhale' | 'hold' | 'exhale', duration: number) => {
      const startTime = Date.now();
      setPhaseProgress(0);
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setPhaseProgress(progress);
        
        if (progress >= 1) {
          clearInterval(progressInterval);
        }
      }, 16); // ~60fps
      
      return progressInterval;
    };

    const breathingCycle = () => {
      // Inhale phase (4 seconds)
      setCurrentPhase('inhale');
      const inhaleProgressInterval = updatePhaseProgress('inhale', inhaleTime);
      
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: inhaleTime,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: inhaleTime,
          useNativeDriver: true,
        }),
      ]).start();

      phaseTimeoutRef.current = setTimeout(() => {
        clearInterval(inhaleProgressInterval);
        
        // Hold phase (2 seconds)
        setCurrentPhase('hold');
        const holdProgressInterval = updatePhaseProgress('hold', holdTime);
        
        phaseTimeoutRef.current = setTimeout(() => {
          clearInterval(holdProgressInterval);
          
          // Exhale phase (4 seconds)
          setCurrentPhase('exhale');
          const exhaleProgressInterval = updatePhaseProgress('exhale', exhaleTime);
          
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.5,
              duration: exhaleTime,
              useNativeDriver: true,
            }),
            Animated.timing(rotationAnim, {
              toValue: 0,
              duration: exhaleTime,
              useNativeDriver: true,
            }),
          ]).start();
          
          phaseTimeoutRef.current = setTimeout(() => {
            clearInterval(exhaleProgressInterval);
          }, exhaleTime);
        }, holdTime);
      }, inhaleTime);
    };

    breathingCycle();
    const cycleInterval = setInterval(breathingCycle, totalCycleTime);
    
    // Timer for exercise duration
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    intervalRef.current = timerInterval;
    return () => {
      clearInterval(cycleInterval);
      clearInterval(timerInterval);
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  };

  const stopBreathingCycle = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    scaleAnim.setValue(0.5);
    rotationAnim.setValue(0);
    setCurrentPhase('inhale');
    setPhaseProgress(0);
  };

  const handleStartStop = () => {
    setIsActive(!isActive);
  };

  const handleBack = () => {
    setIsActive(false);
    navigation.goBack();
  };

  const handleTogglePhysics = () => {
    setEnablePhysics(!enablePhysics);
  };

  const getVisualComponent = () => {
    if (!exercise) return null;

    const spin = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    switch (exercise.visualType) {
      case 'balloon':
        return (
          <Animated.View
            style={[
              styles.balloon,
              {
                backgroundColor: exercise.color,
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              },
            ]}
          >
            <Text style={styles.balloonText}>🎈</Text>
          </Animated.View>
        );
      case 'flower':
        return (
          <Animated.View
            style={[
              styles.flower,
              {
                backgroundColor: exercise.color,
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              },
            ]}
          >
            <Text style={styles.flowerText}>🌸</Text>
          </Animated.View>
        );
      case 'star':
        return (
          <Animated.View
            style={[
              styles.star,
              {
                backgroundColor: exercise.color,
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              },
            ]}
          >
            <Text style={styles.starText}>⭐</Text>
          </Animated.View>
        );
      case 'rainbow':
        return (
          <Animated.View
            style={[
              styles.rainbow,
              {
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              },
            ]}
          >
            <Text style={styles.rainbowText}>🌈</Text>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe In... 🌬️';
      case 'hold':
        return 'Hold... 🤗';
      case 'exhale':
        return 'Breathe Out... 💨';
      default:
        return 'Ready to Start! ✨';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Physics Layer */}
      {enablePhysics && (
        <PhysicsLayer
          isActive={isActive}
          currentPhase={currentPhase}
          phaseProgress={phaseProgress}
          userPosition={{ x: width / 2, y: height * 0.4 }}
          enabledObjectTypes={['bubble', 'leaf', 'feather', 'sparkle']}
          maxObjects={12}
          spawnRate={0.4}
          forceStrength={80}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
        
        {/* Physics Toggle */}
        <TouchableOpacity
          style={[styles.physicsToggle, { backgroundColor: enablePhysics ? '#00B894' : '#636E72' }]}
          onPress={handleTogglePhysics}
          activeOpacity={0.8}
        >
          <Text style={styles.physicsToggleText}>
            {enablePhysics ? '✨ Physics On' : '✨ Physics Off'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.visualContainer}>
        {getVisualComponent()}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.phaseText}>{getPhaseText()}</Text>
        <Text style={styles.instructionText}>
          {exercise.instructions[currentInstruction]}
        </Text>
        
        {/* Phase Progress Indicator */}
        {isActive && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${phaseProgress * 100}%`,
                    backgroundColor: currentPhase === 'inhale' ? '#4ECDC4' : 
                                   currentPhase === 'exhale' ? '#FF6B6B' : '#96CEB4'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(phaseProgress * 100)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.startStopButton, { backgroundColor: isActive ? '#E17055' : '#00B894' }]}
          onPress={handleStartStop}
          activeOpacity={0.8}
        >
          <Text style={styles.startStopButtonText}>
            {isActive ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 5,
  },
  timer: {
    fontSize: 18,
    color: '#636E72',
    fontWeight: '600',
  },
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  balloon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balloonText: {
    fontSize: 60,
  },
  flower: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  flowerText: {
    fontSize: 60,
  },
  star: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  starText: {
    fontSize: 60,
  },
  rainbow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rainbowText: {
    fontSize: 60,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  phaseText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  startStopButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  startStopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#636E72',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#E17055',
    textAlign: 'center',
    marginTop: 50,
  },
  physicsToggle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
    alignSelf: 'center',
  },
  physicsToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 15,
    alignItems: 'center',
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 5,
    fontWeight: '600',
  },
});

export default ExerciseScreen;
