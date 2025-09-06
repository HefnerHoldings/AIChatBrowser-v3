// Animated Microinteraction Toolkit
// Provides smooth animations, spring physics, and delightful microinteractions

export interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
  velocity: number;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fill?: 'forwards' | 'backwards' | 'both' | 'none';
}

export interface GestureConfig {
  threshold: number;
  velocity: number;
  distance: number;
  direction?: 'horizontal' | 'vertical' | 'both';
}

// Spring physics presets
export const springPresets = {
  gentle: { tension: 120, friction: 14, mass: 1, velocity: 0 },
  wobbly: { tension: 180, friction: 12, mass: 1, velocity: 0 },
  stiff: { tension: 210, friction: 20, mass: 1, velocity: 0 },
  slow: { tension: 280, friction: 60, mass: 1, velocity: 0 },
  molasses: { tension: 280, friction: 120, mass: 1, velocity: 0 },
  quick: { tension: 380, friction: 40, mass: 1, velocity: 0 },
  bouncy: { tension: 170, friction: 11, mass: 1, velocity: 0 },
  smooth: { tension: 170, friction: 26, mass: 1, velocity: 0 }
};

// Animation timing functions
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  anticipate: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounceIn: 'cubic-bezier(0.36, 0, 0.44, -0.56)'
};

// Spring physics calculator
export class SpringPhysics {
  private position: number = 0;
  private velocity: number = 0;
  private target: number = 0;
  private config: SpringConfig;

  constructor(config: SpringConfig = springPresets.smooth) {
    this.config = config;
  }

  setTarget(target: number) {
    this.target = target;
  }

  update(deltaTime: number): number {
    const { tension, friction, mass } = this.config;
    
    // Calculate spring force
    const springForce = -tension * (this.position - this.target);
    
    // Calculate damping force
    const dampingForce = -friction * this.velocity;
    
    // Calculate acceleration
    const acceleration = (springForce + dampingForce) / mass;
    
    // Update velocity and position
    this.velocity += acceleration * deltaTime;
    this.position += this.velocity * deltaTime;
    
    return this.position;
  }

  isSettled(threshold: number = 0.01): boolean {
    return Math.abs(this.position - this.target) < threshold && 
           Math.abs(this.velocity) < threshold;
  }

  reset(position: number = 0) {
    this.position = position;
    this.velocity = 0;
  }
}

// Gesture detector
export class GestureDetector {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private config: GestureConfig;

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = {
      threshold: 10,
      velocity: 0.3,
      distance: 50,
      direction: 'both',
      ...config
    };
  }

  onStart(x: number, y: number) {
    this.startX = x;
    this.startY = y;
    this.startTime = Date.now();
  }

  onMove(x: number, y: number): {
    deltaX: number;
    deltaY: number;
    distance: number;
    angle: number;
    velocity: number;
  } {
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);
    const deltaTime = (Date.now() - this.startTime) / 1000;
    const velocity = distance / deltaTime;

    return { deltaX, deltaY, distance, angle, velocity };
  }

  detectSwipe(endX: number, endY: number): 'left' | 'right' | 'up' | 'down' | null {
    const { deltaX, deltaY, distance, velocity } = this.onMove(endX, endY);
    
    if (distance < this.config.distance || velocity < this.config.velocity) {
      return null;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (this.config.direction === 'horizontal' || this.config.direction === 'both') {
      if (absX > absY && absX > this.config.threshold) {
        return deltaX > 0 ? 'right' : 'left';
      }
    }

    if (this.config.direction === 'vertical' || this.config.direction === 'both') {
      if (absY > absX && absY > this.config.threshold) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }

    return null;
  }
}

// Animation orchestrator
export class AnimationOrchestrator {
  private animations: Map<string, Animation> = new Map();
  private springs: Map<string, SpringPhysics> = new Map();
  private rafId: number | null = null;
  private lastTime: number = 0;

  animate(
    element: HTMLElement,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options: AnimationConfig | number
  ): Animation {
    const animation = element.animate(keyframes, options);
    const id = `anim-${Date.now()}-${Math.random()}`;
    this.animations.set(id, animation);
    
    animation.finished.then(() => {
      this.animations.delete(id);
    });

    return animation;
  }

  spring(
    element: HTMLElement,
    property: string,
    target: number,
    config: SpringConfig = springPresets.smooth,
    onUpdate?: (value: number) => void
  ): string {
    const id = `spring-${Date.now()}-${Math.random()}`;
    const spring = new SpringPhysics(config);
    spring.setTarget(target);
    this.springs.set(id, spring);

    if (!this.rafId) {
      this.startSpringLoop();
    }

    // Store update callback
    (spring as any).element = element;
    (spring as any).property = property;
    (spring as any).onUpdate = onUpdate;

    return id;
  }

  private startSpringLoop() {
    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      let hasActiveSprings = false;

      this.springs.forEach((spring, id) => {
        const value = spring.update(deltaTime);
        const { element, property, onUpdate } = spring as any;

        if (onUpdate) {
          onUpdate(value);
        } else if (element && property) {
          if (property === 'translateX' || property === 'translateY') {
            const transform = element.style.transform || '';
            const regex = new RegExp(`${property}\\([^)]*\\)`, 'g');
            element.style.transform = transform.replace(regex, '') + ` ${property}(${value}px)`;
          } else {
            element.style[property as any] = `${value}px`;
          }
        }

        if (spring.isSettled()) {
          this.springs.delete(id);
        } else {
          hasActiveSprings = true;
        }
      });

      if (hasActiveSprings) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stagger(
    elements: HTMLElement[] | NodeListOf<HTMLElement>,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options: AnimationConfig,
    staggerDelay: number = 50
  ): Animation[] {
    const animations: Animation[] = [];
    
    Array.from(elements).forEach((element, index) => {
      const staggeredOptions = {
        ...options,
        delay: (options.delay || 0) + index * staggerDelay
      };
      animations.push(this.animate(element, keyframes, staggeredOptions));
    });

    return animations;
  }

  sequence(
    animations: Array<{
      element: HTMLElement;
      keyframes: Keyframe[] | PropertyIndexedKeyframes;
      options: AnimationConfig | number;
    }>
  ): Promise<void> {
    return animations.reduce((promise, { element, keyframes, options }) => {
      return promise.then(() => {
        const animation = this.animate(element, keyframes, options);
        return animation.finished.then(() => {});
      });
    }, Promise.resolve());
  }

  parallel(
    animations: Array<{
      element: HTMLElement;
      keyframes: Keyframe[] | PropertyIndexedKeyframes;
      options: AnimationConfig | number;
    }>
  ): Promise<void[]> {
    const promises = animations.map(({ element, keyframes, options }) => {
      const animation = this.animate(element, keyframes, options);
      return animation.finished.then(() => {});
    });

    return Promise.all(promises);
  }

  stopAll() {
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();
    this.springs.clear();
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Haptic feedback manager
export class HapticFeedback {
  private supported: boolean;

  constructor() {
    this.supported = 'vibrate' in navigator;
  }

  light() {
    if (this.supported) {
      navigator.vibrate(10);
    }
  }

  medium() {
    if (this.supported) {
      navigator.vibrate(20);
    }
  }

  heavy() {
    if (this.supported) {
      navigator.vibrate(30);
    }
  }

  success() {
    if (this.supported) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  warning() {
    if (this.supported) {
      navigator.vibrate([20, 40, 20]);
    }
  }

  error() {
    if (this.supported) {
      navigator.vibrate([30, 30, 30, 30, 30]);
    }
  }

  pattern(pattern: number[]) {
    if (this.supported) {
      navigator.vibrate(pattern);
    }
  }
}

// Microinteraction presets
export const microinteractions = {
  buttonPress: (element: HTMLElement) => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1)' }
      ],
      { duration: 150, easing: easings.easeOutBack }
    );
  },

  shake: (element: HTMLElement) => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 500, easing: easings.easeInOut }
    );
  },

  pulse: (element: HTMLElement) => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.05)', opacity: 0.8 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      { duration: 300, easing: easings.easeInOut }
    );
  },

  fadeIn: (element: HTMLElement, duration: number = 300) => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration, easing: easings.easeOut, fill: 'forwards' }
    );
  },

  fadeOut: (element: HTMLElement, duration: number = 300) => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-10px)' }
      ],
      { duration, easing: easings.easeIn, fill: 'forwards' }
    );
  },

  slideIn: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'left') => {
    const animator = new AnimationOrchestrator();
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };

    return animator.animate(
      element,
      [
        { transform: transforms[direction], opacity: 0 },
        { transform: 'translate(0)', opacity: 1 }
      ],
      { duration: 300, easing: easings.easeOut, fill: 'forwards' }
    );
  },

  bounce: (element: HTMLElement) => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-20px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' }
      ],
      { duration: 600, easing: easings.bounceOut }
    );
  },

  flip: (element: HTMLElement, axis: 'x' | 'y' = 'y') => {
    const animator = new AnimationOrchestrator();
    const property = axis === 'x' ? 'rotateX' : 'rotateY';
    
    return animator.animate(
      element,
      [
        { transform: `${property}(0deg)` },
        { transform: `${property}(180deg)` },
        { transform: `${property}(360deg)` }
      ],
      { duration: 600, easing: easings.easeInOut }
    );
  },

  glow: (element: HTMLElement, color: string = '#FFD700') => {
    const animator = new AnimationOrchestrator();
    return animator.animate(
      element,
      [
        { boxShadow: 'none' },
        { boxShadow: `0 0 20px ${color}` },
        { boxShadow: 'none' }
      ],
      { duration: 1000, easing: easings.easeInOut }
    );
  },

  ripple: (element: HTMLElement, x: number, y: number) => {
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    ripple.style.pointerEvents = 'none';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - rect.left - size / 2}px`;
    ripple.style.top = `${y - rect.top - size / 2}px`;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    const animator = new AnimationOrchestrator();
    const animation = animator.animate(
      ripple,
      [
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(2)', opacity: 0 }
      ],
      { duration: 600, easing: easings.easeOut }
    );

    animation.finished.then(() => {
      ripple.remove();
    });

    return animation;
  }
};

// Export singleton instances
export const animator = new AnimationOrchestrator();
export const haptics = new HapticFeedback();