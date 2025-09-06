import { useEffect, useState } from 'react';

interface ElectronAPI {
  fetchWithoutCORS: (url: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  executeJS: (code: string) => Promise<{ success: boolean; result?: any; error?: string }>;
  onMenuCommand: (callback: (event: any) => void) => void;
  platform: string;
  version: string;
}

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      setIsElectron(true);
      setElectronAPI((window as any).electronAPI);
    }
  }, []);

  // Helper function to fetch without CORS in Electron
  const fetchNoCORS = async (url: string): Promise<string | null> => {
    if (!electronAPI) {
      // Fallback to regular fetch if not in Electron
      try {
        const response = await fetch('/api/browser-proxy/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.error('Proxy fetch failed:', error);
      }
      return null;
    }

    // Use Electron's CORS-free fetch
    const result = await electronAPI.fetchWithoutCORS(url);
    if (result.success) {
      return result.data || null;
    }
    console.error('Electron fetch failed:', result.error);
    return null;
  };

  // Helper to execute JavaScript in Electron context
  const executeJavaScript = async (code: string): Promise<any> => {
    if (!electronAPI) {
      console.warn('Not running in Electron, cannot execute JavaScript');
      return null;
    }
    
    const result = await electronAPI.executeJS(code);
    if (result.success) {
      return result.result;
    }
    console.error('JavaScript execution failed:', result.error);
    return null;
  };

  return {
    isElectron,
    electronAPI,
    fetchNoCORS,
    executeJavaScript,
    platform: electronAPI?.platform || 'web',
    version: electronAPI?.version || '3.0.0'
  };
}