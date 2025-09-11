// Performance monitoring and analytics utilities
import { config, isProduction, isDevelopment } from '@/config/environment';

// Performance Observer for Web Vitals
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
    this.measureWebVitals();
  }

  private initializeObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      // Observe different performance entry types
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe various performance metrics
      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] 
      });
    } catch (error) {
      console.error('Failed to initialize performance observer:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    const metricName = entry.entryType;
    const value = entry.startTime + entry.duration;

    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    this.metrics.get(metricName)?.push(value);

    // Log in development
    if (isDevelopment) {
      console.log(`[Performance] ${metricName}: ${value.toFixed(2)}ms`);
    }

    // Send to analytics in production
    if (isProduction) {
      this.sendToAnalytics(metricName, value);
    }
  }

  private measureWebVitals() {
    if (typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    this.measureFCP();

    // Largest Contentful Paint (LCP)
    this.measureLCP();

    // First Input Delay (FID)
    this.measureFID();

    // Cumulative Layout Shift (CLS)
    this.measureCLS();

    // Time to First Byte (TTFB)
    this.measureTTFB();
  }

  private measureFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.reportMetric('FCP', fcp.startTime);
        observer.disconnect();
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  private measureLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportMetric('LCP', lastEntry.startTime);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];
      if (firstInput) {
        const fid = firstInput.processingStart - firstInput.startTime;
        this.reportMetric('FID', fid);
        observer.disconnect();
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  private measureCLS() {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      }
      this.reportMetric('CLS', clsValue);
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private measureTTFB() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const ttfb = timing.responseStart - timing.navigationStart;
      this.reportMetric('TTFB', ttfb);
    }
  }

  private reportMetric(name: string, value: number) {
    if (isDevelopment) {
      console.log(`[Web Vital] ${name}: ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'}`);
    }

    // Send to analytics
    this.sendToAnalytics(`web-vital-${name}`, value);

    // Check thresholds and warn if needed
    this.checkThreshold(name, value);
  }

  private checkThreshold(metric: string, value: number) {
    const thresholds: Record<string, { good: number; needs_improvement: number }> = {
      FCP: { good: 1800, needs_improvement: 3000 },
      LCP: { good: 2500, needs_improvement: 4000 },
      FID: { good: 100, needs_improvement: 300 },
      CLS: { good: 0.1, needs_improvement: 0.25 },
      TTFB: { good: 600, needs_improvement: 1500 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return;

    let status = 'good';
    if (value > threshold.needs_improvement) {
      status = 'poor';
    } else if (value > threshold.good) {
      status = 'needs-improvement';
    }

    if (status !== 'good') {
      console.warn(`[Performance Warning] ${metric} is ${status}: ${value.toFixed(2)}`);
    }
  }

  private sendToAnalytics(metric: string, value: number) {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance', {
        event_category: 'Web Vitals',
        event_label: metric,
        value: Math.round(value),
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint
    if (config.API_URL) {
      fetch(`${config.API_URL}/api/analytics/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently fail analytics
      });
    }
  }

  public getMetrics() {
    const result: Record<string, number> = {};
    this.metrics.forEach((values, key) => {
      if (values.length > 0) {
        result[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });
    return result;
  }

  public reset() {
    this.metrics.clear();
  }

  public destroy() {
    this.observer?.disconnect();
  }
}

// Error tracking
class ErrorTracker {
  private errorCount = 0;
  private errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    context?: any;
  }> = [];

  constructor() {
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandledrejection',
        promise: event.promise,
      });
    });
  }

  public trackError(error: Error, context?: any) {
    this.errorCount++;
    
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
    };

    this.errors.push(errorInfo);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Log in development
    if (isDevelopment) {
      console.error('[Error Tracked]', errorInfo);
    }

    // Send to error tracking service in production
    if (isProduction) {
      this.sendErrorToService(errorInfo);
    }
  }

  private sendErrorToService(errorInfo: any) {
    // Send to Sentry if configured
    if (config.MONITORING.SENTRY_DSN && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(errorInfo.message), {
        extra: errorInfo.context,
      });
    }

    // Send to custom error endpoint
    fetch(`${config.API_URL}/api/analytics/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...errorInfo,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail
    });
  }

  public getErrors() {
    return this.errors;
  }

  public getErrorCount() {
    return this.errorCount;
  }

  public clearErrors() {
    this.errors = [];
    this.errorCount = 0;
  }
}

// User behavior analytics
class UserAnalytics {
  private sessionId: string;
  private events: Array<{
    type: string;
    data: any;
    timestamp: number;
  }> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    this.startSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners() {
    // Track page views
    this.trackPageView();

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const testId = target.getAttribute('data-testid');
      if (testId) {
        this.trackEvent('click', {
          element: testId,
          text: target.textContent?.slice(0, 50),
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form-submit', {
        formId: form.id,
        formName: form.name,
      });
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;
        if (maxScroll > 25 && maxScroll < 30) {
          this.trackEvent('scroll', { depth: '25%' });
        } else if (maxScroll > 50 && maxScroll < 55) {
          this.trackEvent('scroll', { depth: '50%' });
        } else if (maxScroll > 75 && maxScroll < 80) {
          this.trackEvent('scroll', { depth: '75%' });
        } else if (maxScroll > 90) {
          this.trackEvent('scroll', { depth: '100%' });
        }
      }
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private trackPageView() {
    this.trackEvent('page-view', {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
    });
  }

  public trackEvent(type: string, data: any = {}) {
    const event = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }

    // Send to analytics service
    if (isProduction) {
      this.sendEvent(event);
    }
  }

  private sendEvent(event: any) {
    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.type, {
        event_category: 'User Interaction',
        event_label: JSON.stringify(event.data),
        value: 1,
      });
    }

    // Batch events and send periodically
    this.batchAndSendEvents();
  }

  private batchAndSendEvents() {
    // Send batched events every 30 seconds
    if (this.events.length >= 10) {
      fetch(`${config.API_URL}/api/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: this.events,
        }),
      }).catch(() => {
        // Silently fail
      });

      this.events = [];
    }
  }

  private startSession() {
    this.trackEvent('session-start', {
      sessionId: this.sessionId,
      timestamp: Date.now(),
    });
  }

  private endSession() {
    const sessionDuration = Date.now() - parseInt(this.sessionId.split('_')[1]);
    this.trackEvent('session-end', {
      sessionId: this.sessionId,
      duration: sessionDuration,
    });
  }

  public getSessionId() {
    return this.sessionId;
  }

  public getEvents() {
    return this.events;
  }
}

// Initialize monitoring
let performanceMonitor: PerformanceMonitor | null = null;
let errorTracker: ErrorTracker | null = null;
let userAnalytics: UserAnalytics | null = null;

export function initializeMonitoring() {
  if (typeof window === 'undefined') return;

  performanceMonitor = new PerformanceMonitor();
  errorTracker = new ErrorTracker();
  userAnalytics = new UserAnalytics();

  // Log initialization
  console.log('[Monitoring] Initialized with:', {
    performance: true,
    errors: true,
    analytics: true,
    environment: config.NODE_ENV,
  });
}

// Export instances
export function getPerformanceMonitor() {
  return performanceMonitor;
}

export function getErrorTracker() {
  return errorTracker;
}

export function getUserAnalytics() {
  return userAnalytics;
}

// Convenience functions
export function trackError(error: Error, context?: any) {
  errorTracker?.trackError(error, context);
}

export function trackEvent(type: string, data?: any) {
  userAnalytics?.trackEvent(type, data);
}

export function getPerformanceMetrics() {
  return performanceMonitor?.getMetrics() || {};
}