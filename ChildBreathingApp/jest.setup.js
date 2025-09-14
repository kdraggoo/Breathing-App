import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native-sound', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      play: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      release: jest.fn(),
    })),
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};