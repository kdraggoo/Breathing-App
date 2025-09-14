# Breathing Physics System

This document describes the breathing-based physics engine implemented for the ChildBreathingApp.

## Overview

The physics system creates immersive visual effects where objects drift toward the user during inhale phases and away during exhale phases, synchronized with the breathing exercises.

## Components

### 1. Physics Engine (`src/utils/physicsEngine.ts`)

**BreathingPhysicsEngine Class:**
- Manages physics simulation with real-time force calculations
- Tracks breathing phases (inhale, hold, exhale) and progress
- Applies breathing-based forces to objects based on distance from user
- Handles object spawning, movement, and cleanup

**Key Features:**
- **Inhale Force**: Negative force pulls objects toward user position
- **Exhale Force**: Positive force pushes objects away from user
- **Hold Phase**: Minimal force during breath holding
- **Distance Falloff**: Force strength decreases with distance from user
- **Object Types**: Support for particles, bubbles, leaves, feathers, and sparkles

### 2. Physics Objects (`src/components/PhysicsObject.tsx`)

Visual components that respond to breathing physics:
- **Bubble** 💧: Light objects that float upward
- **Leaf** 🍃: Medium weight with natural drift
- **Feather** 🪶: Very light, highly responsive to breathing
- **Sparkle** ✨: Fast-moving, magical particles
- **Particle** ●: Simple colored dots

### 3. Physics Layer (`src/components/PhysicsLayer.tsx`)

Container component that:
- Manages the physics engine lifecycle
- Renders all physics objects
- Synchronizes with breathing phases
- Provides configuration options

### 4. Integration (`src/screens/ExerciseScreen.tsx`)

Enhanced exercise screen with:
- Physics toggle button (✨ Physics On/Off)
- Real-time phase progress tracking
- User position configuration
- Breathing phase synchronization

## Physics Properties

Each physics object has configurable properties:

```typescript
interface PhysicsObject {
  id: string;
  x: number;                    // Position X
  y: number;                    // Position Y
  velocityX: number;            // Velocity X
  velocityY: number;            // Velocity Y
  mass: number;                 // Object mass (affects force response)
  isAffectedByBreathing: boolean; // Enable/disable breathing physics
  breathingForceMultiplier: number; // Breathing sensitivity
  dragCoefficient: number;      // Air resistance
  maxSpeed: number;             // Maximum velocity
  visualType: string;           // Visual appearance
  color: string;                // Object color
  size: number;                 // Object size
}
```

## Physics Calculations

### Force Application
```typescript
// During inhale: negative force (attraction)
forceStrength = -baseForceStrength * (0.5 + progress * 0.5)

// During exhale: positive force (repulsion)  
forceStrength = baseForceStrength * (0.5 + progress * 0.5)

// During hold: minimal force
forceStrength = currentForce * 0.1
```

### Distance-Based Force Falloff
```typescript
const falloff = Math.max(0, 1 - distance / maxForceDistance);
const force = normalizedDirection * forceStrength * falloff * multiplier;
```

### Physics Integration
- **Air Resistance**: `velocity *= airResistance`
- **Gravity**: `velocityY += gravityStrength * deltaTime`
- **Speed Limiting**: Prevents objects from moving too fast
- **Boundary Constraints**: Soft boundaries keep objects on screen

## Usage

### Basic Integration
```typescript
import PhysicsLayer from '../components/PhysicsLayer';

<PhysicsLayer
  isActive={isBreathingActive}
  currentPhase={currentPhase}
  phaseProgress={phaseProgress}
  userPosition={{ x: screenWidth/2, y: screenHeight/2 }}
  enabledObjectTypes={['bubble', 'leaf', 'feather', 'sparkle']}
  maxObjects={12}
  spawnRate={0.4}
  forceStrength={80}
/>
```

### Configuration Options
- **maxObjects**: Maximum number of physics objects (default: 15)
- **spawnRate**: Objects spawned per second (default: 0.3)
- **forceStrength**: Base breathing force strength (default: 80)
- **enabledObjectTypes**: Which object types to spawn
- **userPosition**: Center point for breathing forces

## Breathing Phases

### Inhale Phase (4 seconds)
- Objects drift toward user position
- Force strength increases with progress (0-100%)
- Visual objects appear to be "drawn in"

### Hold Phase (2 seconds)  
- Minimal force applied
- Objects maintain current motion with air resistance
- Gentle floating behavior

### Exhale Phase (4 seconds)
- Objects drift away from user position
- Force strength increases with progress (0-100%)
- Visual objects appear to be "blown away"

## Performance Optimizations

- **Frame Rate Capping**: Updates limited to 60fps
- **Object Culling**: Objects removed when off-screen
- **Efficient Rendering**: Uses absolute positioning for smooth animation
- **Memory Management**: Automatic cleanup of old objects
- **Distance Checks**: Force calculations only within effective range

## Customization

### Creating Custom Object Types
```typescript
export const createCustomObject = (x?: number, y?: number): Partial<PhysicsObject> => ({
  x: x ?? Math.random() * screenWidth,
  y: y ?? Math.random() * screenHeight,
  visualType: 'custom',
  color: '#FF6B6B',
  size: 15,
  mass: 1.0,
  breathingForceMultiplier: 1.2,
  maxSpeed: 40
});
```

### Adjusting Physics Parameters
```typescript
physicsEngine.updateConfig({
  baseForceStrength: 120,    // Stronger breathing effect
  maxForceDistance: 400,     // Wider influence range
  airResistance: 0.95,       // More air resistance
  gravityStrength: 0.2       // Stronger gravity
});
```

## Debugging

Enable debug mode to see:
- User position indicator (red dot)
- Object count and performance metrics
- Force vectors and physics state

Debug mode is automatically enabled in development builds (`__DEV__` flag).

## Future Enhancements

Potential improvements:
- **Sound Integration**: Audio feedback for breathing phases
- **Haptic Feedback**: Vibration synchronized with breathing
- **Advanced Visuals**: Particle trails and effects
- **Adaptive Physics**: Difficulty adjustment based on user performance
- **Multi-User**: Shared physics space for group exercises