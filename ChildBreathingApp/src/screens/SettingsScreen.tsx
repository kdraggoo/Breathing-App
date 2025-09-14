import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
    defaultDuration: 60,
    theme: 'colorful',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSoundToggle = (value: boolean) => {
    const newSettings = { ...settings, soundEnabled: value };
    saveSettings(newSettings);
  };

  const handleVibrationToggle = (value: boolean) => {
    const newSettings = { ...settings, vibrationEnabled: value };
    saveSettings(newSettings);
  };

  const handleDurationChange = (duration: number) => {
    const newSettings = { ...settings, defaultDuration: duration };
    saveSettings(newSettings);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'colorful') => {
    const newSettings = { ...settings, theme };
    saveSettings(newSettings);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins === 1 ? '1 minute' : `${mins} minutes`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Audio Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingDescription}>
                Play calming sounds during exercises
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#ddd', true: '#6C5CE7' }}
              thumbColor={settings.soundEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Feel gentle vibrations during breathing
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: '#ddd', true: '#6C5CE7' }}
              thumbColor={settings.vibrationEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Exercise Settings</Text>
          
          <Text style={styles.settingLabel}>Default Duration</Text>
          <Text style={styles.settingDescription}>
            Choose how long exercises should last by default
          </Text>
          
          <View style={styles.durationButtons}>
            {[30, 60, 90, 120, 180].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  settings.defaultDuration === duration && styles.durationButtonActive,
                ]}
                onPress={() => handleDurationChange(duration)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    settings.defaultDuration === duration && styles.durationButtonTextActive,
                  ]}
                >
                  {formatDuration(duration)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Appearance</Text>
          
          <Text style={styles.settingLabel}>Theme</Text>
          <Text style={styles.settingDescription}>
            Choose your favorite color theme
          </Text>
          
          <View style={styles.themeButtons}>
            {[
              { key: 'light', name: 'Light', emoji: '☀️' },
              { key: 'dark', name: 'Dark', emoji: '🌙' },
              { key: 'colorful', name: 'Colorful', emoji: '🌈' },
            ].map((theme) => (
              <TouchableOpacity
                key={theme.key}
                style={[
                  styles.themeButton,
                  settings.theme === theme.key && styles.themeButtonActive,
                ]}
                onPress={() => handleThemeChange(theme.key as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                <Text
                  style={[
                    styles.themeText,
                    settings.theme === theme.key && styles.themeTextActive,
                  ]}
                >
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          
          <View style={styles.aboutInfo}>
            <Text style={styles.aboutText}>
              Breathing Fun helps children learn breathing exercises through 
              interactive and engaging visual experiences.
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 18,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  durationButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  durationButtonActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#E9ECEF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  themeButtonActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  themeEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  themeText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  themeTextActive: {
    color: '#fff',
  },
  aboutInfo: {
    marginTop: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
