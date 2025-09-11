// Test setup and configuration
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.sessionStorage = sessionStorageMock as Storage;

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
})) as any;

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    onLine: true,
    language: 'en-US',
    languages: ['en-US', 'en'],
    userAgent: 'Mozilla/5.0 (Testing)',
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
  },
});

// Mock document methods
document.execCommand = vi.fn();

// Mock console methods in production tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  };
}

// Test utilities
export const waitForAsync = (ms: number = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockApiResponse = (data: any, status = 200) => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
};

export const mockApiError = (error: string, status = 500) => {
  (global.fetch as any).mockRejectedValueOnce(new Error(error));
};

// Performance timing mock
export const mockPerformanceTiming = () => {
  Object.defineProperty(window, 'performance', {
    writable: true,
    value: {
      timing: {
        navigationStart: 0,
        responseStart: 100,
        domContentLoadedEventEnd: 500,
        loadEventEnd: 1000,
      },
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      mark: vi.fn(),
      measure: vi.fn(),
    },
  });
};