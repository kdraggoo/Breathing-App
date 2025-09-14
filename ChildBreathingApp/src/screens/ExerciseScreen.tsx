import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getExerciseById } from '../utils/exercises';
import useBreathingDetector from '../hooks/useBreathingDetector';
import BreathingStatusIndicator from '../components/BreathingStatusIndicator';

// const { width, height } = Dimensions.get('window');

const ExerciseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exerciseId } = route.params as { exerciseId: string };
  
  const exercise = getExerciseById(exerciseId);
  
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeRemaining, setTimeRemaining] = useState(exercise?.duration || 60);
  const [currentInstruction] = useState(0);
  const [showBreathingStatus, setShowBreathingStatus] = useState(true);
  
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize breathing detector
  const {
    breathingState,
    // isDetecting,
    startDetection,
    stopDetection,
    startBreathingIn,
    startBreathingOut,
    startPause,
  } = useBreathingDetector({
    manualMode: true,
    sensitivityThreshold: 0.4,
    pauseDetectionTime: 1500,
  });

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
    const breathingCycle = () => {
      // Inhale phase (4 seconds)
      setCurrentPhase('inhale');
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        // Hold phase (2 seconds)
        setCurrentPhase('hold');
        
        setTimeout(() => {
          // Exhale phase (4 seconds)
          setCurrentPhase('exhale');
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.5,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(rotationAnim, {
              toValue: 0,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]).start();
        }, 2000);
      }, 4000);
    };

    breathingCycle();
    const cycleInterval = setInterval(breathingCycle, 10000); // 10 second cycle
    
    // Timer for exercise duration
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    intervalRef.current = timerInterval;
    return () => {
      clearInterval(cycleInterval);
      clearInterval(timerInterval);
    };
  };

  const stopBreathingCycle = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    scaleAnim.setValue(0.5);
    rotationAnim.setValue(0);
    setCurrentPhase('inhale');
  };

  const handleStartStop = () => {
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    
    // Start/stop breathing detection along with exercise
    if (newActiveState) {
      startDetection();
    } else {
      stopDetection();
    }
  };

  const handleBack = () => {
    setIsActive(false);
    stopDetection();
    navigation.goBack();
  };

  const toggleBreathingStatus = () => {
    setShowBreathingStatus(!showBreathingStatus);
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
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
      </View>

      <View style={styles.visualContainer}>
        {getVisualComponent()}
      </View>

      {/* Breathing Status Indicator */}
      {showBreathingStatus && isActive && (
        <View style={styles.breathingStatusContainer}>
          <BreathingStatusIndicator
            breathingState={breathingState}
            onBreathingIn={startBreathingIn}
            onBreathingOut={startBreathingOut}
            onPause={startPause}
            showManualControls={true}
            size="medium"
            theme="colorful"
          />
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.phaseText}>{getPhaseText()}</Text>
        <Text style={styles.instructionText}>
          {exercise.instructions[currentInstruction]}
        </Text>
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
          style={styles.toggleButton}
          onPress={toggleBreathingStatus}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleButtonText}>
            {showBreathingStatus ? 'Hide Status' : 'Show Status'}
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
  breathingStatusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '90%',
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
  toggleButton: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#74B9FF',
    marginBottom: 10,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
});

export default ExerciseScreen;
