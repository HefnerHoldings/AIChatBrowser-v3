import { useEffect, useRef } from 'react';
import { 
  animator,
  haptics,
  microinteractions,
  springPresets,
  SpringPhysics,
  easings
} from '@/lib/vibecoding/animationToolkit';

// Custom hook for adding animations to elements
export function useAnimation() {
  const animatorRef = useRef(animator);

  useEffect(() => {
    return () => {
      // Clean up animations on unmount
      animatorRef.current.stopAll();
    };
  }, []);

  return {
    animate: animatorRef.current.animate.bind(animatorRef.current),
    spring: animatorRef.current.spring.bind(animatorRef.current),
    stagger: animatorRef.current.stagger.bind(animatorRef.current),
    sequence: animatorRef.current.sequence.bind(animatorRef.current),
    parallel: animatorRef.current.parallel.bind(animatorRef.current),
    microinteractions,
    haptics,
    easings,
    springPresets
  };
}

// Hook for button animations
export function useButtonAnimation(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = () => {
      microinteractions.buttonPress(element);
      haptics.light();
    };

    const handleMouseEnter = () => {
      animator.animate(
        element,
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' }
        ],
        { duration: 150, easing: easings.easeOut, fill: 'forwards' }
      );
    };

    const handleMouseLeave = () => {
      animator.animate(
        element,
        [
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' }
        ],
        { duration: 150, easing: easings.easeOut, fill: 'forwards' }
      );
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);
}

// Hook for card animations
export function useCardAnimation(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial fade in animation
    microinteractions.fadeIn(element, 400);

    const handleMouseEnter = () => {
      animator.animate(
        element,
        [
          { transform: 'translateY(0) scale(1)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
          { transform: 'translateY(-4px) scale(1.02)', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }
        ],
        { duration: 300, easing: easings.easeOut, fill: 'forwards' }
      );
    };

    const handleMouseLeave = () => {
      animator.animate(
        element,
        [
          { transform: 'translateY(-4px) scale(1.02)', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' },
          { transform: 'translateY(0) scale(1)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
        ],
        { duration: 300, easing: easings.easeOut, fill: 'forwards' }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);
}

// Hook for list animations with stagger effect
export function useListAnimation(ref: React.RefObject<HTMLElement>, selector: string = 'li') {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const items = element.querySelectorAll(selector);
    if (items.length === 0) return;

    // Stagger animation on mount
    animator.stagger(
      items as NodeListOf<HTMLElement>,
      [
        { opacity: 0, transform: 'translateX(-20px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      { duration: 300, easing: easings.easeOut },
      50
    );
  }, [ref, selector]);
}

// Hook for spring-based drag animations
export function useSpringDrag(ref: React.RefObject<HTMLElement>) {
  const springX = useRef<SpringPhysics>(new SpringPhysics(springPresets.smooth));
  const springY = useRef<SpringPhysics>(new SpringPhysics(springPresets.smooth));
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const elementPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let rafId: number;

    const animate = () => {
      if (!element) return;
      
      const x = springX.current.update(0.016);
      const y = springY.current.update(0.016);
      
      element.style.transform = `translate(${x}px, ${y}px)`;
      
      if (!springX.current.isSettled() || !springY.current.isSettled()) {
        rafId = requestAnimationFrame(animate);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startPos.current = { x: e.clientX, y: e.clientY };
      const transform = window.getComputedStyle(element).transform;
      if (transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        elementPos.current = { x: matrix.m41, y: matrix.m42 };
      }
      element.style.cursor = 'grabbing';
      haptics.light();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      springX.current.setTarget(elementPos.current.x + deltaX);
      springY.current.setTarget(elementPos.current.y + deltaY);
      
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      
      isDragging.current = false;
      element.style.cursor = 'grab';
      
      // Spring back to origin
      springX.current.setTarget(0);
      springY.current.setTarget(0);
      
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
      
      haptics.light();
    };

    element.style.cursor = 'grab';
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref]);
}

// Hook for notification animations
export function useNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  const show = (elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current;
    if (!element) return;

    // Set initial state
    element.style.display = 'block';
    
    // Animate in
    microinteractions.slideIn(element, 'right');
    
    // Haptic feedback based on type
    switch (type) {
      case 'success':
        haptics.success();
        microinteractions.glow(element, '#10b981');
        break;
      case 'error':
        haptics.error();
        microinteractions.shake(element);
        break;
      case 'warning':
        haptics.warning();
        microinteractions.pulse(element);
        break;
      default:
        haptics.light();
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      microinteractions.fadeOut(element).finished.then(() => {
        if (element) {
          element.style.display = 'none';
        }
      });
    }, 3000);
  };

  return { show };
}

// Hook for scroll-triggered animations
export function useScrollAnimation(ref: React.RefObject<HTMLElement>, threshold: number = 0.1) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            microinteractions.fadeIn(entry.target as HTMLElement, 600);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold]);
}

// Hook for progress animations
export function useProgressAnimation(ref: React.RefObject<HTMLElement>, progress: number) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const progressBar = element.querySelector('[role="progressbar"]') || element;
    
    animator.animate(
      progressBar as HTMLElement,
      [
        { width: progressBar.style.width || '0%' },
        { width: `${progress}%` }
      ],
      { duration: 600, easing: easings.easeInOut, fill: 'forwards' }
    );

    // Celebrate completion
    if (progress === 100) {
      haptics.success();
      microinteractions.bounce(element);
      microinteractions.glow(element, '#10b981');
    }
  }, [ref, progress]);
}