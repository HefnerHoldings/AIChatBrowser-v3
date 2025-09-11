// Environment configuration with proper typing
interface EnvironmentConfig {
  API_URL: string;
  WS_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  VERSION: string;
  BUILD_TIME: string;
  FEATURES: {
    AI_CHAT: boolean;
    MARKETPLACE: boolean;
    COLLABORATION: boolean;
    VOICE_CONTROL: boolean;
    OUTREACH: boolean;
    QA_SUITE: boolean;
    VIBECODING: boolean;
  };
  MONITORING: {
    SENTRY_DSN?: string;
    GA_TRACKING_ID?: string;
    MIXPANEL_TOKEN?: string;
  };
  LIMITS: {
    MAX_FILE_SIZE: number;
    MAX_WORKFLOW_STEPS: number;
    MAX_CONCURRENT_TABS: number;
    SESSION_TIMEOUT: number;
  };
}

// Development configuration
const developmentConfig: EnvironmentConfig = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  NODE_ENV: 'development',
  VERSION: import.meta.env.VITE_APP_VERSION || '3.0.0-dev',
  BUILD_TIME: new Date().toISOString(),
  FEATURES: {
    AI_CHAT: true,
    MARKETPLACE: true,
    COLLABORATION: true,
    VOICE_CONTROL: true,
    OUTREACH: true,
    QA_SUITE: true,
    VIBECODING: true,
  },
  MONITORING: {
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
    MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
  },
  LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_WORKFLOW_STEPS: 100,
    MAX_CONCURRENT_TABS: 50,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  },
};

// Production configuration
const productionConfig: EnvironmentConfig = {
  API_URL: import.meta.env.VITE_API_URL || '',
  WS_URL: import.meta.env.VITE_WS_URL || `wss://${window.location.host}`,
  NODE_ENV: 'production',
  VERSION: import.meta.env.VITE_APP_VERSION || '3.0.0',
  BUILD_TIME: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  FEATURES: {
    AI_CHAT: import.meta.env.VITE_FEATURE_AI_CHAT === 'true',
    MARKETPLACE: import.meta.env.VITE_FEATURE_MARKETPLACE === 'true',
    COLLABORATION: import.meta.env.VITE_FEATURE_COLLABORATION === 'true',
    VOICE_CONTROL: import.meta.env.VITE_FEATURE_VOICE_CONTROL === 'true',
    OUTREACH: import.meta.env.VITE_FEATURE_OUTREACH === 'true',
    QA_SUITE: import.meta.env.VITE_FEATURE_QA_SUITE === 'true',
    VIBECODING: import.meta.env.VITE_FEATURE_VIBECODING === 'true',
  },
  MONITORING: {
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
    MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
  },
  LIMITS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in production
    MAX_WORKFLOW_STEPS: 50,
    MAX_CONCURRENT_TABS: 20,
    SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  },
};

// Test configuration
const testConfig: EnvironmentConfig = {
  API_URL: 'http://localhost:5000',
  WS_URL: 'ws://localhost:5000',
  NODE_ENV: 'test',
  VERSION: '3.0.0-test',
  BUILD_TIME: new Date().toISOString(),
  FEATURES: {
    AI_CHAT: true,
    MARKETPLACE: true,
    COLLABORATION: true,
    VOICE_CONTROL: true,
    OUTREACH: true,
    QA_SUITE: true,
    VIBECODING: true,
  },
  MONITORING: {},
  LIMITS: {
    MAX_FILE_SIZE: 1 * 1024 * 1024, // 1MB for tests
    MAX_WORKFLOW_STEPS: 10,
    MAX_CONCURRENT_TABS: 5,
    SESSION_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  },
};

// Get the appropriate configuration based on environment
function getConfig(): EnvironmentConfig {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return developmentConfig;
  }
}

// Export the configuration
export const config = getConfig();

// Feature flags helper
export function isFeatureEnabled(feature: keyof EnvironmentConfig['FEATURES']): boolean {
  return config.FEATURES[feature] ?? false;
}

// Environment check helpers
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Monitoring helpers
export function initializeMonitoring() {
  if (isProduction && config.MONITORING.SENTRY_DSN) {
    // Initialize Sentry
    import('@sentry/react').then(({ init, BrowserTracing }) => {
      init({
        dsn: config.MONITORING.SENTRY_DSN,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 0.1,
        environment: config.NODE_ENV,
        release: config.VERSION,
      });
    }).catch(console.error);
  }
  
  if (config.MONITORING.GA_TRACKING_ID) {
    // Initialize Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.MONITORING.GA_TRACKING_ID}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', config.MONITORING.GA_TRACKING_ID);
  }
}

// Performance monitoring
export function trackPerformance(metric: string, value: number, metadata?: Record<string, any>) {
  if (!isProduction) {
    console.log(`[Performance] ${metric}: ${value}ms`, metadata);
  }
  
  // Send to monitoring service in production
  if (isProduction && config.MONITORING.MIXPANEL_TOKEN) {
    // Track with Mixpanel or other service
    // mixpanel.track('performance', { metric, value, ...metadata });
  }
}

// Error tracking
export function trackError(error: Error, context?: Record<string, any>) {
  console.error('[Error]', error, context);
  
  if (isProduction && config.MONITORING.SENTRY_DSN) {
    import('@sentry/react').then(({ captureException }) => {
      captureException(error, { extra: context });
    }).catch(console.error);
  }
}

// Type augmentation for window
declare global {
  interface Window {
    dataLayer: any[];
  }
}