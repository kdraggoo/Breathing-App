import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BREATHING_EXERCISES } from '../utils/exercises';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleExercisePress = (exerciseId: string) => {
    navigation.navigate('Exercise', { exerciseId });
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleBreathingDemoPress = () => {
    navigation.navigate('BreathingDemo');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Breathing Fun! 🌟</Text>
          <Text style={styles.subtitle}>
            Choose a breathing exercise to help you feel calm and relaxed
          </Text>
        </View>

        <View style={styles.exercisesContainer}>
          {BREATHING_EXERCISES.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[styles.exerciseCard, { backgroundColor: exercise.color }]}
              onPress={() => handleExercisePress(exercise.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.exerciseEmoji}>
                {exercise.visualType === 'balloon' && '🎈'}
                {exercise.visualType === 'flower' && '🌸'}
                {exercise.visualType === 'rainbow' && '🌈'}
                {exercise.visualType === 'star' && '⭐'}
              </Text>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDescription}>
                {exercise.description}
              </Text>
              <Text style={styles.exerciseDuration}>
                {Math.floor(exercise.duration / 60)} minutes
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleBreathingDemoPress}
          activeOpacity={0.8}
        >
          <Text style={styles.demoButtonText}>🫁 Breathing Status Demo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          activeOpacity={0.8}
        >
          <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 22,
  },
  exercisesContainer: {
    gap: 20,
  },
  exerciseCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  exerciseEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
    opacity: 0.9,
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.8,
  },
  demoButton: {
    backgroundColor: '#6C5CE7',
    padding: 15,
    borderRadius: 15,
    marginTop: 30,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#636E72',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
