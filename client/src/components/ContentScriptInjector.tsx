import { useEffect, useRef } from 'react';

interface ContentScript {
  matches: string[];
  js?: string[];
  css?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
  match_about_blank?: boolean;
  world?: 'ISOLATED' | 'MAIN';
}

interface ContentScriptInjectorProps {
  scripts: ContentScript[];
  enabled: boolean;
  extensionId: string;
  targetUrl: string;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

export function ContentScriptInjector({
  scripts,
  enabled,
  extensionId,
  targetUrl,
  iframeRef
}: ContentScriptInjectorProps) {
  const injectedScripts = useRef(new Set<string>());
  const injectedStyles = useRef(new Set<string>());
  const messageChannels = useRef(new Map<string, MessageChannel>());

  useEffect(() => {
    if (!enabled || !iframeRef?.current) return;

    const iframe = iframeRef.current;
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) return;

    // Check if URL matches any script patterns
    const matchingScripts = scripts.filter(script => 
      matchesPattern(targetUrl, script.matches)
    );

    if (matchingScripts.length === 0) return;

    // Clean up previous injections
    cleanup();

    // Sort scripts by run_at timing
    const sortedScripts = sortScripts(matchingScripts);

    // Inject scripts based on timing
    injectScriptsAtTiming(sortedScripts, iframeWindow);

    return () => cleanup();
  }, [scripts, enabled, extensionId, targetUrl, iframeRef]);

  const matchesPattern = (url: string, patterns: string[]): boolean => {
    return patterns.some(pattern => {
      // Convert Chrome extension pattern to regex
      const regex = patternToRegex(pattern);
      return regex.test(url);
    });
  };

  const patternToRegex = (pattern: string): RegExp => {
    // Handle special patterns
    if (pattern === '<all_urls>') {
      return /^(https?|ftp|file|chrome-extension):\/\/.*/;
    }

    // Convert Chrome pattern to regex
    let regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    // Handle protocol wildcards
    if (regexStr.startsWith('*://')) {
      regexStr = '(https?|ftp)' + regexStr.substring(1);
    }
    
    return new RegExp('^' + regexStr + '$');
  };

  const sortScripts = (scripts: ContentScript[]): Map<string, ContentScript[]> => {
    const sorted = new Map<string, ContentScript[]>();
    
    ['document_start', 'document_end', 'document_idle'].forEach(timing => {
      sorted.set(timing, scripts.filter(s => (s.run_at || 'document_idle') === timing));
    });
    
    return sorted;
  };

  const injectScriptsAtTiming = (sortedScripts: Map<string, ContentScript[]>, targetWindow: Window) => {
    // Document Start - Before DOM construction
    const startScripts = sortedScripts.get('document_start') || [];
    startScripts.forEach(script => injectScript(script, targetWindow, 'start'));

    // Document End - After DOM ready but before resources loaded
    if (targetWindow.document.readyState === 'loading') {
      targetWindow.document.addEventListener('DOMContentLoaded', () => {
        const endScripts = sortedScripts.get('document_end') || [];
        endScripts.forEach(script => injectScript(script, targetWindow, 'end'));
      });
    } else {
      const endScripts = sortedScripts.get('document_end') || [];
      endScripts.forEach(script => injectScript(script, targetWindow, 'end'));
    }

    // Document Idle - After window load
    if (targetWindow.document.readyState === 'complete') {
      const idleScripts = sortedScripts.get('document_idle') || [];
      idleScripts.forEach(script => injectScript(script, targetWindow, 'idle'));
    } else {
      targetWindow.addEventListener('load', () => {
        const idleScripts = sortedScripts.get('document_idle') || [];
        idleScripts.forEach(script => injectScript(script, targetWindow, 'idle'));
      });
    }
  };

  const injectScript = (script: ContentScript, targetWindow: Window, timing: string) => {
    const doc = targetWindow.document;
    
    // Inject CSS files
    if (script.css) {
      script.css.forEach(cssFile => {
        if (!injectedStyles.current.has(cssFile)) {
          const style = doc.createElement('style');
          style.setAttribute('data-extension-id', extensionId);
          style.setAttribute('data-css-file', cssFile);
          
          // In real implementation, fetch CSS content
          style.textContent = getCSSContent(cssFile);
          
          doc.head.appendChild(style);
          injectedStyles.current.add(cssFile);
        }
      });
    }

    // Inject JavaScript files
    if (script.js) {
      script.js.forEach(jsFile => {
        const scriptId = `${extensionId}-${jsFile}-${timing}`;
        
        if (!injectedScripts.current.has(scriptId)) {
          if (script.world === 'MAIN') {
            // Inject in main world (page context)
            injectInMainWorld(jsFile, doc);
          } else {
            // Inject in isolated world (default)
            injectInIsolatedWorld(jsFile, targetWindow);
          }
          
          injectedScripts.current.add(scriptId);
        }
      });
    }
  };

  const injectInMainWorld = (jsFile: string, doc: Document) => {
    const script = doc.createElement('script');
    script.setAttribute('data-extension-id', extensionId);
    script.setAttribute('data-js-file', jsFile);
    
    // In real implementation, fetch script content
    script.textContent = getScriptContent(jsFile);
    
    doc.head.appendChild(script);
    script.remove(); // Remove after execution
  };

  const injectInIsolatedWorld = (jsFile: string, targetWindow: Window) => {
    // Create isolated context for the script
    const isolatedContext = createIsolatedContext(targetWindow);
    
    // In real implementation, fetch and execute script
    const scriptContent = getScriptContent(jsFile);
    
    try {
      // Execute in isolated context
      const scriptFunction = new Function('chrome', 'window', 'document', scriptContent);
      scriptFunction(isolatedContext.chrome, targetWindow, targetWindow.document);
    } catch (error) {
      console.error(`Failed to inject content script ${jsFile}:`, error);
    }
  };

  const createIsolatedContext = (targetWindow: Window) => {
    // Create Chrome API for content scripts
    const channel = new MessageChannel();
    const port1 = channel.port1;
    const port2 = channel.port2;
    
    messageChannels.current.set(extensionId, channel);
    
    const chromeAPI = {
      runtime: {
        id: extensionId,
        sendMessage: (message: any, callback?: Function) => {
          port1.postMessage({ type: 'message', data: message });
          if (callback) {
            port1.addEventListener('message', (e) => {
              if (e.data.type === 'response') {
                callback(e.data.data);
              }
            }, { once: true });
          }
        },
        onMessage: {
          addListener: (callback: Function) => {
            port1.addEventListener('message', (e) => {
              if (e.data.type === 'message') {
                callback(e.data.data, { id: 'browser' }, (response: any) => {
                  port1.postMessage({ type: 'response', data: response });
                });
              }
            });
          }
        },
        connect: (extensionId?: string, connectInfo?: any) => {
          return {
            name: connectInfo?.name || '',
            postMessage: (message: any) => {
              port1.postMessage({ type: 'port-message', data: message });
            },
            onMessage: {
              addListener: (callback: Function) => {
                port1.addEventListener('message', (e) => {
                  if (e.data.type === 'port-message') {
                    callback(e.data.data);
                  }
                });
              }
            },
            onDisconnect: {
              addListener: (callback: Function) => {
                port1.addEventListener('close', () => callback());
              }
            },
            disconnect: () => {
              port1.close();
            }
          };
        }
      },
      storage: {
        local: {
          get: (keys: any, callback: Function) => {
            port1.postMessage({ type: 'storage-get', keys });
            port1.addEventListener('message', (e) => {
              if (e.data.type === 'storage-response') {
                callback(e.data.data);
              }
            }, { once: true });
          },
          set: (items: any, callback?: Function) => {
            port1.postMessage({ type: 'storage-set', items });
            callback?.();
          }
        },
        sync: {
          get: () => {},
          set: () => {}
        }
      },
      tabs: {
        sendMessage: (tabId: number, message: any, callback?: Function) => {
          port1.postMessage({ type: 'tab-message', tabId, data: message });
          if (callback) {
            port1.addEventListener('message', (e) => {
              if (e.data.type === 'tab-response') {
                callback(e.data.data);
              }
            }, { once: true });
          }
        }
      }
    };
    
    return { chrome: chromeAPI, port: port2 };
  };

  const getCSSContent = (cssFile: string): string => {
    // Mock CSS content - in real implementation, fetch from extension
    return `
      /* Extension CSS: ${cssFile} */
      .extension-injected {
        /* Styles injected by extension */
      }
    `;
  };

  const getScriptContent = (jsFile: string): string => {
    // Mock script content - in real implementation, fetch from extension
    return `
      // Extension Script: ${jsFile}
      console.log('Content script injected from extension: ${extensionId}');
      
      // Example content script functionality
      (function() {
        'use strict';
        
        // Listen for messages from extension
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script received message:', request);
            sendResponse({ received: true });
          });
        }
        
        // Modify page content
        const observer = new MutationObserver((mutations) => {
          // React to page changes
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      })();
    `;
  };

  const cleanup = () => {
    // Remove injected styles
    injectedStyles.current.forEach(cssFile => {
      const styles = document.querySelectorAll(`style[data-css-file="${cssFile}"]`);
      styles.forEach(style => style.remove());
    });
    injectedStyles.current.clear();
    
    // Clear script tracking
    injectedScripts.current.clear();
    
    // Close message channels
    messageChannels.current.forEach(channel => {
      channel.port1.close();
      channel.port2.close();
    });
    messageChannels.current.clear();
  };

  return null; // This component doesn't render anything
}

// Helper function to inject content scripts into existing tabs
export function injectContentScriptsIntoTab(
  tabId: number,
  scripts: ContentScript[],
  extensionId: string
) {
  // This would be called when an extension is newly installed
  // to inject scripts into already open tabs
  console.log(`Injecting content scripts from ${extensionId} into tab ${tabId}`);
}

// Helper function to handle declarative content scripts
export function registerDeclarativeContentScripts(
  extensionId: string,
  scripts: ContentScript[]
) {
  // Register scripts that will be automatically injected
  // when matching pages are loaded
  console.log(`Registering declarative content scripts for ${extensionId}`);
}