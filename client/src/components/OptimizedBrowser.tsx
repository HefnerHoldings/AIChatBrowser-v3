import React, { useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { debounce } from 'lodash';

// Optimized hooks for browser performance
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Memoized tab manager
export const useTabManager = () => {
  const tabsRef = useRef(new Map());
  const [tabs, setTabs] = React.useState<Map<string, any>>(new Map());
  
  const addTab = useCallback((id: string, tab: any) => {
    tabsRef.current.set(id, tab);
    setTabs(new Map(tabsRef.current));
  }, []);
  
  const removeTab = useCallback((id: string) => {
    tabsRef.current.delete(id);
    setTabs(new Map(tabsRef.current));
  }, []);
  
  const updateTab = useCallback((id: string, updates: Partial<any>) => {
    const existing = tabsRef.current.get(id);
    if (existing) {
      tabsRef.current.set(id, { ...existing, ...updates });
      setTabs(new Map(tabsRef.current));
    }
  }, []);
  
  return { tabs, addTab, removeTab, updateTab };
};

// Performance monitor with RAF
export const usePerformanceMonitor = () => {
  const rafRef = useRef<number>();
  const metricsRef = useRef({ fps: 0, memory: 0, cpu: 0 });
  const [metrics, setMetrics] = React.useState(metricsRef.current);
  
  const updateMetrics = useCallback(() => {
    const now = performance.now();
    // Calculate FPS and other metrics
    metricsRef.current.fps = Math.round(1000 / (now - (rafRef.current || now)));
    
    // Update state periodically, not on every frame
    if (Math.random() > 0.95) {
      setMetrics({ ...metricsRef.current });
    }
    
    rafRef.current = now;
  }, []);
  
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      updateMetrics();
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationId);
  }, [updateMetrics]);
  
  return metrics;
};

// Lazy load heavy components
export const LazyComponentLoader = memo(({ 
  component: Component, 
  fallback,
  ...props 
}: any) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  useEffect(() => {
    // Delay heavy component loading
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isLoaded) return fallback || null;
  return <Component {...props} />;
});

// Virtualized list for tabs
export const VirtualizedTabList = memo(({ 
  tabs, 
  activeTabId, 
  onTabClick,
  itemHeight = 40,
  containerHeight = 400
}: any) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight]);
  
  const visibleTabs = useMemo(() => {
    return tabs.slice(visibleRange.start, visibleRange.end);
  }, [tabs, visibleRange]);
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: tabs.length * itemHeight, position: 'relative' }}>
        {visibleTabs.map((tab: any, index: number) => (
          <div
            key={tab.id}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
            onClick={() => onTabClick(tab.id)}
            className={tab.id === activeTabId ? 'active' : ''}
          >
            {tab.title}
          </div>
        ))}
      </div>
    </div>
  );
});

// Optimized search with debouncing
export const useOptimizedSearch = (delay = 300) => {
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const abortControllerRef = useRef<AbortController>();
  
  const debouncedQuery = useDebounce(query, delay);
  
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`/api/search?q=${searchQuery}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
    }
  }, []);
  
  useEffect(() => {
    fetchSuggestions(debouncedQuery);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, fetchSuggestions]);
  
  return { query, setQuery, suggestions };
};

// Memory-efficient event listener manager
export const useEventManager = () => {
  const listenersRef = useRef(new Map());
  
  const addEventListener = useCallback((
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    const key = `${event}-${handler.toString()}`;
    
    if (!listenersRef.current.has(key)) {
      target.addEventListener(event, handler, options);
      listenersRef.current.set(key, { target, event, handler, options });
    }
  }, []);
  
  const removeEventListener = useCallback((
    event: string,
    handler: EventListener
  ) => {
    const key = `${event}-${handler.toString()}`;
    const listener = listenersRef.current.get(key);
    
    if (listener) {
      listener.target.removeEventListener(listener.event, listener.handler, listener.options);
      listenersRef.current.delete(key);
    }
  }, []);
  
  const removeAllListeners = useCallback(() => {
    listenersRef.current.forEach(listener => {
      listener.target.removeEventListener(listener.event, listener.handler, listener.options);
    });
    listenersRef.current.clear();
  }, []);
  
  useEffect(() => {
    return () => removeAllListeners();
  }, [removeAllListeners]);
  
  return { addEventListener, removeEventListener, removeAllListeners };
};

// Intersection observer for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isIntersecting;
};

// Request idle callback wrapper
export const useIdleCallback = (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
  const callbackRef = useRef(callback);
  const handleRef = useRef<number>();
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  useEffect(() => {
    const cb: IdleRequestCallback = (deadline) => callbackRef.current(deadline);
    
    if ('requestIdleCallback' in window) {
      handleRef.current = window.requestIdleCallback(cb, options);
    } else {
      // Fallback for browsers without idle callback
      handleRef.current = setTimeout(() => cb({
        didTimeout: false,
        timeRemaining: () => 0
      } as IdleDeadline), 1);
    }
    
    return () => {
      if (handleRef.current) {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(handleRef.current);
        } else {
          clearTimeout(handleRef.current);
        }
      }
    };
  }, [options]);
};

// Batch state updates
export const useBatchedState = <T,>(initialState: T) => {
  const [state, setState] = React.useState(initialState);
  const pendingUpdates = useRef<Partial<T>[]>([]);
  const rafRef = useRef<number>();
  
  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdates.current.push(update);
    
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        const merged = pendingUpdates.current.reduce(
          (acc, update) => ({ ...acc, ...update }),
          {}
        );
        
        setState(prev => ({ ...prev, ...merged }));
        pendingUpdates.current = [];
        rafRef.current = undefined;
      });
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  return [state, batchUpdate] as const;
};

export default {
  useDebounce,
  useTabManager,
  usePerformanceMonitor,
  LazyComponentLoader,
  VirtualizedTabList,
  useOptimizedSearch,
  useEventManager,
  useIntersectionObserver,
  useIdleCallback,
  useBatchedState
};