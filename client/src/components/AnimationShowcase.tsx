import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Zap, 
  Sparkles, 
  Mouse,
  Waves,
  Activity,
  Settings
} from 'lucide-react';
import {
  animator,
  haptics,
  microinteractions,
  springPresets,
  easings,
  SpringPhysics,
  GestureDetector,
  AnimationOrchestrator
} from '@/lib/vibecoding/animationToolkit';

export function AnimationShowcase() {
  const [activeTab, setActiveTab] = useState('microinteractions');
  const [springConfig, setSpringConfig] = useState('smooth');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const demoBoxRef = useRef<HTMLDivElement>(null);
  const springBoxRef = useRef<HTMLDivElement>(null);
  const gestureBoxRef = useRef<HTMLDivElement>(null);
  const orchestratorRef = useRef<AnimationOrchestrator>(new AnimationOrchestrator());
  const springRef = useRef<SpringPhysics | null>(null);
  const gestureRef = useRef<GestureDetector>(new GestureDetector());
  
  // Spring animation loop
  useEffect(() => {
    if (springBoxRef.current && isPlaying) {
      const spring = new SpringPhysics(springPresets[springConfig as keyof typeof springPresets]);
      spring.setTarget(200);
      springRef.current = spring;
      
      let rafId: number;
      let lastTime = performance.now();
      
      const animate = (currentTime: number) => {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        const value = spring.update(deltaTime * animationSpeed);
        
        if (springBoxRef.current) {
          springBoxRef.current.style.transform = `translateX(${value}px)`;
        }
        
        if (!spring.isSettled() && isPlaying) {
          rafId = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      };
      
      rafId = requestAnimationFrame(animate);
      
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [isPlaying, springConfig, animationSpeed]);

  // Gesture handling
  const handleGestureStart = (e: React.MouseEvent | React.TouchEvent) => {
    const point = 'touches' in e ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY };
    
    gestureRef.current.onStart(point.x, point.y);
  };

  const handleGestureMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gestureBoxRef.current) return;
    
    const point = 'touches' in e ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY };
    
    const { deltaX, deltaY } = gestureRef.current.onMove(point.x, point.y);
    
    gestureBoxRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  };

  const handleGestureEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gestureBoxRef.current) return;
    
    const point = 'touches' in e ? 
      { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } :
      { x: e.clientX, y: e.clientY };
    
    const swipe = gestureRef.current.detectSwipe(point.x, point.y);
    
    if (swipe) {
      haptics.medium();
      // Animate based on swipe direction
      microinteractions.shake(gestureBoxRef.current);
    } else {
      // Spring back to original position
      orchestratorRef.current.animate(
        gestureBoxRef.current,
        [
          { transform: gestureBoxRef.current.style.transform },
          { transform: 'translate(0, 0)' }
        ],
        { duration: 300, easing: easings.easeOutBack }
      );
    }
  };

  const runMicrointeraction = (type: keyof typeof microinteractions) => {
    if (demoBoxRef.current) {
      haptics.light();
      microinteractions[type](demoBoxRef.current as any);
    }
  };

  const runSequence = async () => {
    if (!demoBoxRef.current) return;
    
    await orchestratorRef.current.sequence([
      {
        element: demoBoxRef.current,
        keyframes: [
          { transform: 'translateX(0) scale(1)' },
          { transform: 'translateX(100px) scale(1.1)' }
        ],
        options: { duration: 300, easing: easings.easeOut }
      },
      {
        element: demoBoxRef.current,
        keyframes: [
          { transform: 'translateX(100px) scale(1.1) rotate(0deg)' },
          { transform: 'translateX(100px) scale(1.1) rotate(180deg)' }
        ],
        options: { duration: 400, easing: easings.easeInOut }
      },
      {
        element: demoBoxRef.current,
        keyframes: [
          { transform: 'translateX(100px) scale(1.1) rotate(180deg)' },
          { transform: 'translateX(0) scale(1) rotate(360deg)' }
        ],
        options: { duration: 500, easing: easings.bounceOut }
      }
    ]);
    
    haptics.success();
  };

  const runParallel = () => {
    const elements = document.querySelectorAll('.parallel-demo');
    orchestratorRef.current.stagger(
      elements as NodeListOf<HTMLElement>,
      [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: 'translateY(-20px) scale(1.2)', opacity: 0.8 },
        { transform: 'translateY(0) scale(1)', opacity: 1 }
      ],
      { duration: 600, easing: easings.easeInOut },
      100
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold">Animation Toolkit</h2>
        <Badge variant="outline" className="ml-auto">
          <Activity className="w-3 h-3 mr-1" />
          Interactive
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="microinteractions">
            <Zap className="w-4 h-4 mr-2" />
            Micro
          </TabsTrigger>
          <TabsTrigger value="springs">
            <Waves className="w-4 h-4 mr-2" />
            Springs
          </TabsTrigger>
          <TabsTrigger value="gestures">
            <Mouse className="w-4 h-4 mr-2" />
            Gestures
          </TabsTrigger>
          <TabsTrigger value="orchestration">
            <Settings className="w-4 h-4 mr-2" />
            Orchestrate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="microinteractions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Microinteractions</h3>
            
            <div className="flex justify-center mb-6">
              <div
                ref={demoBoxRef}
                className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg flex items-center justify-center text-white font-bold"
              >
                Demo
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('buttonPress')}
              >
                Press
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('shake')}
              >
                Shake
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('pulse')}
              >
                Pulse
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('bounce')}
              >
                Bounce
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('flip')}
              >
                Flip
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('glow')}
              >
                Glow
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('fadeIn')}
              >
                Fade In
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runMicrointeraction('fadeOut')}
              >
                Fade Out
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  if (demoBoxRef.current) {
                    microinteractions.ripple(
                      demoBoxRef.current,
                      demoBoxRef.current.offsetWidth / 2,
                      demoBoxRef.current.offsetHeight / 2
                    );
                  }
                }}
              >
                Ripple
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="springs" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Spring Physics</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={springConfig} onValueChange={setSpringConfig}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(springPresets).map(preset => (
                      <SelectItem key={preset} value={preset}>
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm">Speed:</span>
                  <Slider
                    value={[animationSpeed]}
                    onValueChange={([value]) => setAnimationSpeed(value)}
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm w-10">{animationSpeed}x</span>
                </div>
              </div>

              <div className="relative h-32 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  ref={springBoxRef}
                  className="absolute top-1/2 left-4 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg shadow-lg"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsPlaying(true);
                    if (springBoxRef.current) {
                      springBoxRef.current.style.transform = 'translateX(0)';
                    }
                  }}
                  disabled={isPlaying}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Button>
                <Button
                  onClick={() => setIsPlaying(false)}
                  variant="outline"
                  disabled={!isPlaying}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={() => {
                    if (springBoxRef.current) {
                      springBoxRef.current.style.transform = 'translateX(0)';
                    }
                    setIsPlaying(false);
                  }}
                  variant="outline"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gestures" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gesture Detection</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Drag the box below to test gesture detection. Swipe quickly for haptic feedback!
              </p>
              
              <div className="relative h-64 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  ref={gestureBoxRef}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg cursor-move flex items-center justify-center text-white"
                  onMouseDown={handleGestureStart}
                  onMouseMove={handleGestureMove}
                  onMouseUp={handleGestureEnd}
                  onMouseLeave={handleGestureEnd}
                  onTouchStart={handleGestureStart}
                  onTouchMove={handleGestureMove}
                  onTouchEnd={handleGestureEnd}
                >
                  <Mouse className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => haptics.light()}
                >
                  Light Haptic
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => haptics.medium()}
                >
                  Medium Haptic
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => haptics.success()}
                >
                  Success Pattern
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => haptics.error()}
                >
                  Error Pattern
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Animation Orchestration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Button onClick={runSequence} className="w-full">
                  Run Sequence Animation
                </Button>
                <Button onClick={runParallel} variant="outline" className="w-full">
                  Run Stagger Animation
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="parallel-demo w-full h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg"
                  />
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}