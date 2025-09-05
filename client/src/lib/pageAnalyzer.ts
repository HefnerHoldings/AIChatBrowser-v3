// Page Content Analyzer for Smart Workflow Recognition
interface PageElement {
  type: 'form' | 'table' | 'list' | 'button' | 'link' | 'input' | 'image' | 'video' | 'text';
  selector: string;
  text?: string;
  attributes?: Record<string, string>;
  count?: number;
}

interface PageAnalysis {
  url: string;
  title: string;
  elements: PageElement[];
  patterns: string[];
  suggestedActions: string[];
}

interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  confidence: number;
  steps: any[];
  tags: string[];
}

export class PageAnalyzer {
  analyzeContent(content: string, url: string = ''): PageAnalysis {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    const elements: PageElement[] = [];
    const patterns: string[] = [];
    const suggestedActions: string[] = [];
    
    // Analyze forms
    const forms = doc.querySelectorAll('form');
    if (forms.length > 0) {
      patterns.push('form-submission');
      suggestedActions.push('Fill and submit forms');
      elements.push({
        type: 'form',
        selector: 'form',
        count: forms.length
      });
    }
    
    // Analyze tables
    const tables = doc.querySelectorAll('table');
    if (tables.length > 0) {
      patterns.push('data-table');
      suggestedActions.push('Extract table data');
      elements.push({
        type: 'table',
        selector: 'table',
        count: tables.length
      });
    }
    
    // Analyze lists
    const lists = doc.querySelectorAll('ul, ol');
    if (lists.length > 0) {
      patterns.push('list-content');
      suggestedActions.push('Extract list items');
      elements.push({
        type: 'list',
        selector: 'ul, ol',
        count: lists.length
      });
    }
    
    // Analyze buttons
    const buttons = doc.querySelectorAll('button, input[type="button"], input[type="submit"]');
    if (buttons.length > 0) {
      patterns.push('interactive-buttons');
      elements.push({
        type: 'button',
        selector: 'button',
        count: buttons.length
      });
    }
    
    // Analyze input fields
    const inputs = doc.querySelectorAll('input:not([type="button"]):not([type="submit"]), textarea, select');
    if (inputs.length > 0) {
      patterns.push('input-fields');
      elements.push({
        type: 'input',
        selector: 'input, textarea, select',
        count: inputs.length
      });
    }
    
    // Analyze links
    const links = doc.querySelectorAll('a[href]');
    const externalLinks = Array.from(links).filter(link => {
      const href = (link as HTMLAnchorElement).href;
      return href && (href.startsWith('http') || href.startsWith('//'));
    });
    
    if (links.length > 0) {
      patterns.push('navigation-links');
      if (externalLinks.length > 5) {
        suggestedActions.push('Follow links and extract data');
      }
      elements.push({
        type: 'link',
        selector: 'a[href]',
        count: links.length
      });
    }
    
    // Analyze images
    const images = doc.querySelectorAll('img');
    if (images.length > 0) {
      patterns.push('image-content');
      if (images.length > 10) {
        suggestedActions.push('Download images');
      }
      elements.push({
        type: 'image',
        selector: 'img',
        count: images.length
      });
    }
    
    // Pattern detection for common page types
    if (url.includes('search') || doc.querySelector('input[type="search"]')) {
      patterns.push('search-page');
      suggestedActions.push('Automate search queries');
    }
    
    if (url.includes('login') || url.includes('signin') || doc.querySelector('input[type="password"]')) {
      patterns.push('login-page');
      suggestedActions.push('Automate login process');
    }
    
    if (url.includes('product') || url.includes('shop') || doc.querySelector('[class*="price"]')) {
      patterns.push('e-commerce');
      suggestedActions.push('Monitor prices and availability');
    }
    
    if (doc.querySelectorAll('article, [class*="article"], [class*="post"]').length > 0) {
      patterns.push('content-blog');
      suggestedActions.push('Extract article content');
    }
    
    return {
      url,
      title: doc.title || 'Untitled',
      elements,
      patterns,
      suggestedActions
    };
  }
  
  generateWorkflowSuggestions(analysis: PageAnalysis): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];
    
    // Form submission workflow
    if (analysis.patterns.includes('form-submission')) {
      suggestions.push({
        id: 'form-automation',
        name: 'Automatiser skjemainnsending',
        description: 'Fyll ut og send inn skjemaer automatisk med forhåndsdefinerte verdier',
        confidence: 0.9,
        tags: ['form', 'automation', 'input'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til siden',
            config: { url: analysis.url }
          },
          {
            type: 'fill',
            name: 'Fyll ut skjemafelt',
            config: { selector: 'input, textarea, select' }
          },
          {
            type: 'click',
            name: 'Send inn skjema',
            config: { selector: 'button[type="submit"], input[type="submit"]' }
          }
        ]
      });
    }
    
    // Table data extraction
    if (analysis.patterns.includes('data-table')) {
      suggestions.push({
        id: 'table-extraction',
        name: 'Ekstraher tabelldata',
        description: 'Hent strukturerte data fra tabeller på siden',
        confidence: 0.95,
        tags: ['data', 'extraction', 'table'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til siden',
            config: { url: analysis.url }
          },
          {
            type: 'extract',
            name: 'Hent tabelldata',
            config: { 
              selector: 'table',
              format: 'structured'
            }
          }
        ]
      });
    }
    
    // List extraction
    if (analysis.patterns.includes('list-content') && analysis.elements.find(e => e.type === 'list')?.count > 0) {
      suggestions.push({
        id: 'list-extraction',
        name: 'Hent listeelementer',
        description: 'Ekstraher alle elementer fra lister på siden',
        confidence: 0.85,
        tags: ['list', 'extraction', 'content'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til siden',
            config: { url: analysis.url }
          },
          {
            type: 'extract',
            name: 'Hent listeelementer',
            config: { 
              selector: 'ul li, ol li',
              format: 'list'
            }
          }
        ]
      });
    }
    
    // Search automation
    if (analysis.patterns.includes('search-page')) {
      suggestions.push({
        id: 'search-automation',
        name: 'Automatiser søk',
        description: 'Utfør søk og hent resultater automatisk',
        confidence: 0.88,
        tags: ['search', 'automation', 'query'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til søkesiden',
            config: { url: analysis.url }
          },
          {
            type: 'fill',
            name: 'Skriv inn søkeord',
            config: { selector: 'input[type="search"], input[name*="search"], input[placeholder*="search"]' }
          },
          {
            type: 'click',
            name: 'Utfør søk',
            config: { selector: 'button[type="submit"], button[class*="search"]' }
          },
          {
            type: 'wait',
            name: 'Vent på resultater',
            config: { duration: 2000 }
          },
          {
            type: 'extract',
            name: 'Hent søkeresultater',
            config: { selector: '[class*="result"], [class*="item"]' }
          }
        ]
      });
    }
    
    // Login automation
    if (analysis.patterns.includes('login-page')) {
      suggestions.push({
        id: 'login-automation',
        name: 'Automatisk innlogging',
        description: 'Logg inn automatisk med lagrede påloggingsdetaljer',
        confidence: 0.92,
        tags: ['login', 'authentication', 'security'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til innloggingssiden',
            config: { url: analysis.url }
          },
          {
            type: 'fill',
            name: 'Skriv inn brukernavn',
            config: { selector: 'input[type="email"], input[type="text"][name*="user"], input[name*="email"]' }
          },
          {
            type: 'fill',
            name: 'Skriv inn passord',
            config: { selector: 'input[type="password"]' }
          },
          {
            type: 'click',
            name: 'Logg inn',
            config: { selector: 'button[type="submit"], input[type="submit"], button[class*="login"]' }
          }
        ]
      });
    }
    
    // E-commerce monitoring
    if (analysis.patterns.includes('e-commerce')) {
      suggestions.push({
        id: 'price-monitoring',
        name: 'Overvåk priser',
        description: 'Spor prisendringer og tilgjengelighet for produkter',
        confidence: 0.87,
        tags: ['e-commerce', 'monitoring', 'price'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til produktsiden',
            config: { url: analysis.url }
          },
          {
            type: 'extract',
            name: 'Hent produktinformasjon',
            config: { 
              selector: '[class*="price"], [class*="title"], [class*="availability"]',
              format: 'structured'
            }
          },
          {
            type: 'condition',
            name: 'Sjekk prisendring',
            config: { 
              condition: 'price_changed',
              action: 'notify'
            }
          }
        ]
      });
    }
    
    // Content extraction
    if (analysis.patterns.includes('content-blog')) {
      suggestions.push({
        id: 'article-extraction',
        name: 'Hent artikkelinnhold',
        description: 'Ekstraher og lagre artikkelinnhold fra bloggen',
        confidence: 0.9,
        tags: ['content', 'article', 'blog'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til artikkelsiden',
            config: { url: analysis.url }
          },
          {
            type: 'extract',
            name: 'Hent artikkelinnhold',
            config: { 
              selector: 'article, main, [class*="content"], [class*="post"]',
              format: 'text'
            }
          }
        ]
      });
    }
    
    // Image download workflow
    if (analysis.elements.find(e => e.type === 'image')?.count > 10) {
      suggestions.push({
        id: 'image-download',
        name: 'Last ned bilder',
        description: 'Last ned alle bilder fra siden automatisk',
        confidence: 0.82,
        tags: ['download', 'images', 'media'],
        steps: [
          {
            type: 'navigate',
            name: 'Gå til siden',
            config: { url: analysis.url }
          },
          {
            type: 'extract',
            name: 'Hent bildeurler',
            config: { 
              selector: 'img[src]',
              attribute: 'src',
              format: 'urls'
            }
          },
          {
            type: 'loop',
            name: 'Last ned hvert bilde',
            config: { 
              items: 'image_urls',
              action: 'download'
            }
          }
        ]
      });
    }
    
    // Sort suggestions by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}

export const pageAnalyzer = new PageAnalyzer();