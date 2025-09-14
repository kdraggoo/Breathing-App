import { Dimensions } from 'react-native';
import { PhysicsObject, BreathingPhysicsState, PhysicsEngineConfig } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export class BreathingPhysicsEngine {
  private objects: PhysicsObject[] = [];
  private physicsState: BreathingPhysicsState;
  private config: PhysicsEngineConfig;
  private lastUpdateTime: number = Date.now();
  private animationFrame: number | null = null;
  private updateCallback?: (objects: PhysicsObject[]) => void;

  constructor(config: Partial<PhysicsEngineConfig> = {}) {
    this.config = {
      maxObjects: 20,
      spawnRate: 0.5, // objects per second
      baseForceStrength: 100,
      maxForceDistance: 300,
      gravityStrength: 0.1,
      airResistance: 0.98,
      ...config
    };

    this.physicsState = {
      isActive: false,
      currentPhase: 'inhale',
      phaseProgress: 0,
      forceStrength: 0,
      userPosition: { x: screenWidth / 2, y: screenHeight / 2 }
    };
  }

  public start(updateCallback: (objects: PhysicsObject[]) => void): void {
    this.updateCallback = updateCallback;
    this.physicsState.isActive = true;
    this.lastUpdateTime = Date.now();
    this.update();
  }

  public stop(): void {
    this.physicsState.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public updateBreathingPhase(phase: 'inhale' | 'hold' | 'exhale', progress: number): void {
    this.physicsState.currentPhase = phase;
    this.physicsState.phaseProgress = progress;
    
    // Calculate force strength based on breathing phase
    switch (phase) {
      case 'inhale':
        // Stronger inward force during inhale
        this.physicsState.forceStrength = -this.config.baseForceStrength * (0.5 + progress * 0.5);
        break;
      case 'exhale':
        // Outward force during exhale
        this.physicsState.forceStrength = this.config.baseForceStrength * (0.5 + progress * 0.5);
        break;
      case 'hold':
        // Minimal force during hold
        this.physicsState.forceStrength = this.physicsState.forceStrength * 0.1;
        break;
    }
  }

  public setUserPosition(x: number, y: number): void {
    this.physicsState.userPosition = { x, y };
  }

  public addObject(objectData: Partial<PhysicsObject>): PhysicsObject {
    const newObject: PhysicsObject = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      velocityX: 0,
      velocityY: 0,
      mass: 1,
      isAffectedByBreathing: true,
      breathingForceMultiplier: 1,
      dragCoefficient: 0.02,
      maxSpeed: 50,
      visualType: 'particle',
      color: '#FF6B6B',
      size: 10,
      ...objectData
    };

    if (this.objects.length < this.config.maxObjects) {
      this.objects.push(newObject);
    } else {
      // Replace oldest object
      this.objects.shift();
      this.objects.push(newObject);
    }

    return newObject;
  }

  public removeObject(id: string): void {
    this.objects = this.objects.filter(obj => obj.id !== id);
  }

  public clearObjects(): void {
    this.objects = [];
  }

  public getObjects(): PhysicsObject[] {
    return [...this.objects];
  }

  private update = (): void => {
    if (!this.physicsState.isActive) return;

    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.016); // Cap at 60fps
    this.lastUpdateTime = currentTime;

    // Update physics for each object
    this.objects.forEach(obj => {
      if (obj.isAffectedByBreathing) {
        this.applyBreathingForce(obj, deltaTime);
      }
      this.applyPhysics(obj, deltaTime);
      this.constrainToBounds(obj);
    });

    // Spawn new objects occasionally
    if (Math.random() < this.config.spawnRate * deltaTime && this.objects.length < this.config.maxObjects) {
      this.spawnRandomObject();
    }

    // Remove objects that are too far out of bounds
    this.objects = this.objects.filter(obj => 
      obj.x > -100 && obj.x < screenWidth + 100 && 
      obj.y > -100 && obj.y < screenHeight + 100
    );

    // Notify callback with updated objects
    if (this.updateCallback) {
      this.updateCallback(this.getObjects());
    }

    this.animationFrame = requestAnimationFrame(this.update);
  };

  private applyBreathingForce(obj: PhysicsObject, deltaTime: number): void {
    if (this.physicsState.forceStrength === 0) return;

    const dx = obj.x - this.physicsState.userPosition.x;
    const dy = obj.y - this.physicsState.userPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.config.maxForceDistance && distance > 0) {
      // Normalize direction vector
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Calculate force falloff (stronger closer to user)
      const falloff = Math.max(0, 1 - distance / this.config.maxForceDistance);
      
      // Apply force (negative for inhale/attraction, positive for exhale/repulsion)
      const forceX = normalizedX * this.physicsState.forceStrength * falloff * obj.breathingForceMultiplier * deltaTime;
      const forceY = normalizedY * this.physicsState.forceStrength * falloff * obj.breathingForceMultiplier * deltaTime;

      obj.velocityX += forceX / obj.mass;
      obj.velocityY += forceY / obj.mass;
    }
  }

  private applyPhysics(obj: PhysicsObject, deltaTime: number): void {
    // Apply air resistance
    obj.velocityX *= this.config.airResistance;
    obj.velocityY *= this.config.airResistance;

    // Apply slight downward gravity for realism
    obj.velocityY += this.config.gravityStrength * deltaTime;

    // Limit maximum speed
    const speed = Math.sqrt(obj.velocityX * obj.velocityX + obj.velocityY * obj.velocityY);
    if (speed > obj.maxSpeed) {
      const scale = obj.maxSpeed / speed;
      obj.velocityX *= scale;
      obj.velocityY *= scale;
    }

    // Update position
    obj.x += obj.velocityX * deltaTime;
    obj.y += obj.velocityY * deltaTime;
  }

  private constrainToBounds(obj: PhysicsObject): void {
    // Soft boundary - slow down objects near edges
    const margin = 50;
    const bounceStrength = 0.3;

    if (obj.x < margin) {
      obj.velocityX += (margin - obj.x) * bounceStrength;
    } else if (obj.x > screenWidth - margin) {
      obj.velocityX -= (obj.x - (screenWidth - margin)) * bounceStrength;
    }

    if (obj.y < margin) {
      obj.velocityY += (margin - obj.y) * bounceStrength;
    } else if (obj.y > screenHeight - margin) {
      obj.velocityY -= (obj.y - (screenHeight - margin)) * bounceStrength;
    }
  }

  private spawnRandomObject(): void {
    const visualTypes: PhysicsObject['visualType'][] = ['particle', 'bubble', 'leaf', 'feather', 'sparkle'];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];

    // Spawn from edges of screen
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (edge) {
      case 0: // top
        x = Math.random() * screenWidth;
        y = -20;
        break;
      case 1: // right
        x = screenWidth + 20;
        y = Math.random() * screenHeight;
        break;
      case 2: // bottom
        x = Math.random() * screenWidth;
        y = screenHeight + 20;
        break;
      case 3: // left
        x = -20;
        y = Math.random() * screenHeight;
        break;
      default:
        x = Math.random() * screenWidth;
        y = Math.random() * screenHeight;
    }

    this.addObject({
      x,
      y,
      visualType: visualTypes[Math.floor(Math.random() * visualTypes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 12,
      mass: 0.5 + Math.random() * 1.5,
      breathingForceMultiplier: 0.8 + Math.random() * 0.4,
      maxSpeed: 30 + Math.random() * 40
    });
  }

  public getPhysicsState(): BreathingPhysicsState {
    return { ...this.physicsState };
  }

  public getConfig(): PhysicsEngineConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PhysicsEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance for global use
export const breathingPhysicsEngine = new BreathingPhysicsEngine();

// Helper functions for creating specific types of physics objects
export const createBubble = (x?: number, y?: number): Partial<PhysicsObject> => ({
  x: x ?? Math.random() * screenWidth,
  y: y ?? screenHeight + 20,
  visualType: 'bubble',
  color: '#4ECDC4',
  size: 12 + Math.random() * 8,
  mass: 0.3,
  breathingForceMultiplier: 1.2,
  maxSpeed: 25,
  velocityY: -10 - Math.random() * 10
});

export const createLeaf = (x?: number, y?: number): Partial<PhysicsObject> => ({
  x: x ?? Math.random() * screenWidth,
  y: y ?? -20,
  visualType: 'leaf',
  color: '#96CEB4',
  size: 10 + Math.random() * 6,
  mass: 0.8,
  breathingForceMultiplier: 0.9,
  maxSpeed: 35,
  velocityY: 5 + Math.random() * 10
});

export const createFeather = (x?: number, y?: number): Partial<PhysicsObject> => ({
  x: x ?? Math.random() * screenWidth,
  y: y ?? Math.random() * screenHeight,
  visualType: 'feather',
  color: '#FECA57',
  size: 8 + Math.random() * 4,
  mass: 0.2,
  breathingForceMultiplier: 1.5,
  maxSpeed: 20,
  dragCoefficient: 0.05
});

export const createSparkle = (x?: number, y?: number): Partial<PhysicsObject> => ({
  x: x ?? Math.random() * screenWidth,
  y: y ?? Math.random() * screenHeight,
  visualType: 'sparkle',
  color: '#FF9FF3',
  size: 6 + Math.random() * 4,
  mass: 0.1,
  breathingForceMultiplier: 2.0,
  maxSpeed: 60
});