// MadEasy Browser Extension - Background Script
// Handles extension lifecycle, context menus, and background tasks

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('MadEasy Browser Extension installed:', details);
  
  // Create context menus
  createContextMenus();
  
  // Set default settings
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      enabled: true,
      aiAssistant: true,
      quickSearch: true,
      theme: 'auto'
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'MadEasy Browser Extension',
      message: 'Extension installed successfully! Click the icon to get started.'
    });
  }
});

// Create context menus
function createContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // AI Assistant menu
    chrome.contextMenus.create({
      id: 'ai-assistant',
      title: 'Ask MadEasy AI',
      contexts: ['selection', 'page']
    });
    
    // Quick actions
    chrome.contextMenus.create({
      id: 'quick-search',
      title: 'Quick AI Search: "%s"',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'summarize-page',
      title: 'Summarize this page',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: 'Translate selection',
      contexts: ['selection']
    });
    
    // Separator
    chrome.contextMenus.create({
      id: 'separator1',
      type: 'separator',
      contexts: ['page', 'selection']
    });
    
    // Bookmarks and history
    chrome.contextMenus.create({
      id: 'smart-bookmark',
      title: 'Smart Bookmark',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: 'find-similar',
      title: 'Find similar pages',
      contexts: ['page']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'ai-assistant':
      openAIAssistant(tab, info.selectionText);
      break;
      
    case 'quick-search':
      performQuickSearch(info.selectionText, tab);
      break;
      
    case 'summarize-page':
      summarizePage(tab);
      break;
      
    case 'translate-selection':
      translateText(info.selectionText, tab);
      break;
      
    case 'smart-bookmark':
      createSmartBookmark(tab);
      break;
      
    case 'find-similar':
      findSimilarPages(tab);
      break;
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    
    switch (command) {
      case 'toggle_assistant':
        toggleAssistant(tab);
        break;
        
      case 'quick_search':
        openQuickSearch(tab);
        break;
    }
  });
});

// AI Assistant functions
async function openAIAssistant(tab, selectedText = '') {
  try {
    // Inject the AI assistant UI
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: injectAIAssistant,
      args: [selectedText]
    });
  } catch (error) {
    console.error('Failed to open AI assistant:', error);
  }
}

function injectAIAssistant(selectedText) {
  // Create AI assistant overlay
  if (document.getElementById('madeasy-ai-assistant')) {
    document.getElementById('madeasy-ai-assistant').remove();
  }
  
  const assistant = document.createElement('div');
  assistant.id = 'madeasy-ai-assistant';
  assistant.innerHTML = `
    <div class="madeasy-assistant-overlay">
      <div class="madeasy-assistant-panel">
        <div class="madeasy-assistant-header">
          <h3>MadEasy AI Assistant</h3>
          <button class="madeasy-close-btn">&times;</button>
        </div>
        <div class="madeasy-assistant-content">
          <textarea placeholder="Ask me anything about this page or selected text..." rows="3">${selectedText}</textarea>
          <div class="madeasy-assistant-actions">
            <button class="madeasy-btn madeasy-btn-primary">Ask AI</button>
            <button class="madeasy-btn">Summarize Page</button>
            <button class="madeasy-btn">Translate</button>
          </div>
        </div>
        <div class="madeasy-assistant-response"></div>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .madeasy-assistant-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .madeasy-assistant-panel {
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .madeasy-assistant-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .madeasy-assistant-header h3 {
      margin: 0;
      color: #333;
    }
    .madeasy-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }
    .madeasy-assistant-content textarea {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 15px;
      font-family: inherit;
      resize: vertical;
    }
    .madeasy-assistant-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .madeasy-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 14px;
    }
    .madeasy-btn-primary {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    .madeasy-btn:hover {
      background: #f8f9fa;
    }
    .madeasy-btn-primary:hover {
      background: #0056b3;
    }
    .madeasy-assistant-response {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      display: none;
    }
  `;
  
  assistant.appendChild(style);
  document.body.appendChild(assistant);
  
  // Add event listeners
  assistant.querySelector('.madeasy-close-btn').onclick = () => {
    assistant.remove();
  };
  
  assistant.querySelector('.madeasy-assistant-overlay').onclick = (e) => {
    if (e.target === assistant.querySelector('.madeasy-assistant-overlay')) {
      assistant.remove();
    }
  };
}

async function performQuickSearch(query, tab) {
  try {
    // Send query to AI service
    const response = await fetch('http://localhost:5000/api/ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        context: tab.url
      })
    });
    
    const result = await response.json();
    
    // Show result in notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Search Result',
      message: result.summary || 'Search completed'
    });
    
  } catch (error) {
    console.error('Quick search failed:', error);
  }
}

async function summarizePage(tab) {
  try {
    // Get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return {
          title: document.title,
          content: document.body.innerText.substring(0, 5000),
          url: window.location.href
        };
      }
    });
    
    const pageData = results[0].result;
    
    // Send to AI service for summarization
    const response = await fetch('http://localhost:5000/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pageData)
    });
    
    const summary = await response.json();
    
    // Show summary in popup or notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Page Summary',
      message: summary.text || 'Summary generated'
    });
    
  } catch (error) {
    console.error('Page summarization failed:', error);
  }
}

async function translateText(text, tab) {
  try {
    const response = await fetch('http://localhost:5000/api/ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        targetLanguage: 'auto'
      })
    });
    
    const translation = await response.json();
    
    // Show translation
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Translation',
      message: translation.text || 'Translation completed'
    });
    
  } catch (error) {
    console.error('Translation failed:', error);
  }
}

async function createSmartBookmark(tab) {
  try {
    // Create bookmark with AI-generated tags and description
    const bookmark = await chrome.bookmarks.create({
      title: tab.title,
      url: tab.url
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Smart Bookmark Created',
      message: `Bookmarked: ${tab.title}`
    });
    
  } catch (error) {
    console.error('Smart bookmark failed:', error);
  }
}

async function findSimilarPages(tab) {
  try {
    // Find similar pages using AI
    const response = await fetch('http://localhost:5000/api/ai/similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title
      })
    });
    
    const similar = await response.json();
    
    // Open similar pages or show in popup
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Similar Pages Found',
      message: `Found ${similar.pages?.length || 0} similar pages`
    });
    
  } catch (error) {
    console.error('Find similar pages failed:', error);
  }
}

function toggleAssistant(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const assistant = document.getElementById('madeasy-ai-assistant');
      if (assistant) {
        assistant.remove();
      } else {
        // Inject assistant
        window.postMessage({ type: 'MADEASY_TOGGLE_ASSISTANT' }, '*');
      }
    }
  });
}

function openQuickSearch(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const searchBox = prompt('Quick AI Search:');
      if (searchBox) {
        window.postMessage({ 
          type: 'MADEASY_QUICK_SEARCH', 
          query: searchBox 
        }, '*');
      }
    }
  });
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'AI_QUERY':
      handleAIQuery(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'GET_SETTINGS':
      chrome.storage.sync.get(null, sendResponse);
      return true;
      
    case 'SAVE_SETTINGS':
      chrome.storage.sync.set(request.data, () => {
        sendResponse({ success: true });
      });
      return true;
  }
});

async function handleAIQuery(data, sendResponse) {
  try {
    const response = await fetch('http://localhost:5000/api/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    sendResponse({ success: true, data: result });
    
  } catch (error) {
    console.error('AI query failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}
