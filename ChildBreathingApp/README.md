# 🌟 Child Breathing App

[![CI](https://github.com/yourusername/ChildBreathingApp/workflows/CI/badge.svg)](https://github.com/yourusername/ChildBreathingApp/actions/workflows/ci.yml)
[![Android Build](https://github.com/yourusername/ChildBreathingApp/workflows/Android%20Build/badge.svg)](https://github.com/yourusername/ChildBreathingApp/actions/workflows/android.yml)
[![iOS Build](https://github.com/yourusername/ChildBreathingApp/workflows/iOS%20Build/badge.svg)](https://github.com/yourusername/ChildBreathingApp/actions/workflows/ios.yml)
[![codecov](https://codecov.io/gh/yourusername/ChildBreathingApp/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/ChildBreathingApp)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=childbreathingapp&metric=alert_status)](https://sonarcloud.io/dashboard?id=childbreathingapp)

A React Native app designed to help children with breathing exercises and mindfulness practices.

A cross-platform mobile app designed to teach children breathing exercises through engaging, interactive experiences with kid-friendly visuals and sounds.

## ✨ Features

### 🎈 Interactive Breathing Exercises
- **Balloon Breathing**: Visual balloon inflation/deflation with gentle animations
- **Flower Breathing**: Flower blooming/closing with calming colors
- **Rainbow Breathing**: Color progression following the rainbow spectrum
- **Star Breathing**: Star expanding/contracting with twinkling effects

### 🎨 Child-Friendly Interface
- Bright, colorful design that appeals to children
- Large, easy-to-tap buttons for small fingers
- Simple navigation that's intuitive for kids
- Encouraging animations and positive feedback
- Accessible design with clear visual cues

### ⚙️ Customizable Settings
- Exercise duration options (30s, 1min, 2min, 3min)
- Sound effects toggle for audio feedback
- Vibration settings for tactile feedback
- Theme selection (Light, Dark, Colorful)
- User preferences saved locally

### 📊 Progress Tracking
- Simple achievement system with badges
- Exercise completion tracking
- Daily streak encouragement
- Progress visualization for motivation

## 🛠️ Technical Stack

- **Framework**: React Native 0.81.4 (cross-platform)
- **Language**: TypeScript for type safety
- **Navigation**: React Navigation for smooth screen transitions
- **Animations**: React Native Reanimated for smooth animations
- **Storage**: AsyncStorage for user preferences
- **Icons**: React Native Vector Icons for consistent iconography
- **Audio**: React Native Sound for sound effects (future implementation)

## 📱 Supported Platforms

- iOS (iPhone/iPad)
- Android (phones/tablets)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v20 or higher)
- npm or yarn
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kdraggoo/Breathing-App.git
   cd Breathing-App/ChildBreathingApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Start the Metro bundler**
   ```bash
   npm start
   ```

5. **Run the app**

   For iOS:
   ```bash
   npm run ios
   ```

   For Android:
   ```bash
   npm run android
   ```

## 🎯 How to Use

### For Parents/Guardians
1. **Download and install** the app on your child's device
2. **Open the app** and explore the different breathing exercises together
3. **Choose an exercise** that appeals to your child
4. **Guide them** through the breathing patterns shown on screen
5. **Use settings** to customize the experience for your child's needs

### For Children
1. **Tap on a colorful exercise card** to start
2. **Follow the visual cues** - watch the balloon, flower, star, or rainbow
3. **Breathe in** when it gets bigger
4. **Breathe out** when it gets smaller
5. **Feel calm and relaxed** after completing the exercise!

## 🎨 Exercise Types

### 🎈 Balloon Breathing
- **Best for**: Children who love balloons and simple visuals
- **Duration**: 1 minute
- **Instructions**: Breathe in to inflate the balloon, breathe out to deflate it

### 🌸 Flower Breathing
- **Best for**: Children who enjoy nature and gentle activities
- **Duration**: 1.5 minutes
- **Instructions**: Smell the flower by breathing in, let the scent go by breathing out

### 🌈 Rainbow Breathing
- **Best for**: Children who love colors and longer exercises
- **Duration**: 2 minutes
- **Instructions**: Follow each color of the rainbow as you breathe

### ⭐ Star Breathing
- **Best for**: Children who enjoy space and starry themes
- **Duration**: 1.25 minutes
- **Instructions**: Trace the star points as you breathe in and out

## 🔧 Development

### Project Structure
```
ChildBreathingApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and data
│   └── assets/             # Images, sounds, and other assets
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
└── App.tsx                 # Main app entry point
```

### Adding New Exercises
1. Add exercise data to `src/utils/exercises.ts`
2. Create visual component in `ExerciseScreen.tsx`
3. Add appropriate animations and timing
4. Test with different durations and settings

### Customizing Themes
1. Modify color schemes in `src/types/index.ts`
2. Update component styles throughout the app
3. Add new theme options in `SettingsScreen.tsx`

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues**
```bash
npx react-native start --reset-cache
```

**iOS build issues**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

**Android build issues**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

**Node modules issues**
```bash
rm -rf node_modules
npm install
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Include tests for new features
- Update documentation as needed
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native community for the excellent framework
- Child development experts who provided guidance on age-appropriate design
- Parents and children who tested early versions and provided feedback

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the React Native documentation

## 🔮 Future Features

- [ ] Audio guidance and calming music
- [ ] More breathing exercise variations
- [ ] Parent dashboard for tracking progress
- [ ] Social features for sharing achievements
- [ ] Offline mode for use without internet
- [ ] Accessibility improvements for children with special needs
- [ ] Multi-language support
- [ ] Custom exercise creation tools

---

Made with ❤️ for children's wellbeing and mental health