// Test script to verify volume slider functionality
// Run this with: node test-volume.js

const SoundManager = require('./src/utils/soundManager').default;

console.log('Testing Volume Control...');
console.log('========================');

// Create sound manager instance
const soundManager = SoundManager.getInstance();

// Test different volume levels
const testVolumes = [0.0, 0.25, 0.5, 0.75, 1.0];

testVolumes.forEach((volume, index) => {
  setTimeout(() => {
    console.log(`\nTesting volume: ${Math.round(volume * 100)}%`);
    
    const testSettings = {
      soundEnabled: true,
      soundVolume: volume,
      vibrationEnabled: true,
      defaultDuration: 60,
      theme: 'light'
    };
    
    soundManager.updateSettings(testSettings);
    console.log('Settings updated:', testSettings);
    
    // Test sound methods
    console.log('Testing playInhaleSound...');
    soundManager.playInhaleSound();
    
    setTimeout(() => {
      console.log('Testing playExhaleSound...');
      soundManager.playExhaleSound();
    }, 1000);
    
  }, index * 3000);
});

setTimeout(() => {
  console.log('\nVolume control test completed!');
  soundManager.cleanup();
}, testVolumes.length * 3000 + 2000);
