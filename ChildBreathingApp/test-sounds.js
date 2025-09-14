// Simple test script to verify sound system
// Run this with: node test-sounds.js

const SoundManager = require('./src/utils/soundManager').default;

console.log('Testing Sound System...');
console.log('======================');

// Create sound manager instance
const soundManager = SoundManager.getInstance();

// Test settings
const testSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  defaultDuration: 60,
  theme: 'light'
};

console.log('1. Updating settings...');
soundManager.updateSettings(testSettings);

console.log('2. Testing sound enabled status...');
console.log('Sound enabled:', soundManager.isSoundEnabled());

console.log('3. Testing sound methods...');
console.log('Note: In a React Native environment, these would play actual sounds');

// Test all sound methods
console.log('Testing playInhaleSound...');
soundManager.playInhaleSound();

setTimeout(() => {
  console.log('Testing playExhaleSound...');
  soundManager.playExhaleSound();
}, 1000);

setTimeout(() => {
  console.log('Testing playHoldSound...');
  soundManager.playHoldSound();
}, 2000);

setTimeout(() => {
  console.log('Testing playStartSound...');
  soundManager.playStartSound();
}, 3000);

setTimeout(() => {
  console.log('Testing playPauseSound...');
  soundManager.playPauseSound();
}, 4000);

setTimeout(() => {
  console.log('Testing playCompletionSound...');
  soundManager.playCompletionSound();
}, 5000);

setTimeout(() => {
  console.log('Testing cleanup...');
  soundManager.cleanup();
  console.log('Sound system test completed!');
}, 6000);
