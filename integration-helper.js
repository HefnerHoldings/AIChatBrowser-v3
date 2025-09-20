#!/usr/bin/env node

/**
 * AIChatBrowser v3.01 Integration Helper
 * Analyzes new version and prepares integration with current v3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IntegrationHelper {
  constructor() {
    this.currentVersion = '/workspace';
    this.newVersion = '/workspace/v31-source';
    this.changes = {
      newFiles: [],
      modifiedFiles: [],
      newFeatures: [],
      designChanges: []
    };
  }

  async analyzeVersions() {
    console.log('🔍 Analyzing AIChatBrowser versions...\n');
    
    // Check if new version exists
    if (!fs.existsSync(this.newVersion)) {
      console.log('❌ New version not found at:', this.newVersion);
      console.log('📋 Please copy v31 files to workspace first\n');
      return false;
    }

    await this.compareStructures();
    await this.analyzeComponents();
    await this.analyzeLandingPage();
    await this.analyzeStyles();
    
    this.generateIntegrationPlan();
    return true;
  }

  async compareStructures() {
    console.log('📁 Comparing directory structures...');
    
    const currentStructure = this.getDirectoryStructure(this.currentVersion);
    const newStructure = this.getDirectoryStructure(this.newVersion);
    
    // Find new directories and files
    this.findNewItems(currentStructure, newStructure);
    
    console.log(`✅ Found ${this.changes.newFiles.length} new files\n`);
  }

  getDirectoryStructure(dir, relativePath = '') {
    const structure = {};
    
    if (!fs.existsSync(dir)) return structure;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
          structure[item] = this.getDirectoryStructure(fullPath, relPath);
        }
      } else {
        structure[item] = {
          path: relPath,
          size: fs.statSync(fullPath).size,
          modified: fs.statSync(fullPath).mtime
        };
      }
    }
    
    return structure;
  }

  findNewItems(current, newStruct, basePath = '') {
    for (const [key, value] of Object.entries(newStruct)) {
      const currentPath = basePath ? `${basePath}/${key}` : key;
      
      if (!current[key]) {
        // New item found
        if (typeof value === 'object' && value.path) {
          this.changes.newFiles.push({
            path: currentPath,
            type: 'file',
            size: value.size
          });
        } else {
          this.changes.newFiles.push({
            path: currentPath,
            type: 'directory'
          });
        }
      } else if (typeof value === 'object' && !value.path) {
        // Directory - recurse
        this.findNewItems(current[key] || {}, value, currentPath);
      }
    }
  }

  async analyzeComponents() {
    console.log('🧩 Analyzing React components...');
    
    const newComponentsDir = path.join(this.newVersion, 'client/src/components');
    const currentComponentsDir = path.join(this.currentVersion, 'client/src/components');
    
    if (fs.existsSync(newComponentsDir)) {
      const newComponents = this.getReactComponents(newComponentsDir);
      const currentComponents = this.getReactComponents(currentComponentsDir);
      
      // Find new components
      const newComponentNames = newComponents.filter(comp => 
        !currentComponents.includes(comp)
      );
      
      this.changes.newFeatures.push(...newComponentNames.map(comp => ({
        type: 'component',
        name: comp,
        category: 'React Component'
      })));
      
      console.log(`✅ Found ${newComponentNames.length} new components\n`);
    }
  }

  getReactComponents(dir) {
    const components = [];
    
    if (!fs.existsSync(dir)) return components;
    
    const walk = (currentDir) => {
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const fullPath = path.join(currentDir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          const relativePath = path.relative(dir, fullPath);
          components.push(relativePath);
        }
      }
    };
    
    walk(dir);
    return components;
  }

  async analyzeLandingPage() {
    console.log('🏠 Analyzing landing page improvements...');
    
    const newLandingPage = path.join(this.newVersion, 'client/src/pages/home.tsx');
    const currentLandingPage = path.join(this.currentVersion, 'client/src/pages/home.tsx');
    
    if (fs.existsSync(newLandingPage) && fs.existsSync(currentLandingPage)) {
      const newContent = fs.readFileSync(newLandingPage, 'utf8');
      const currentContent = fs.readFileSync(currentLandingPage, 'utf8');
      
      if (newContent !== currentContent) {
        this.changes.designChanges.push({
          type: 'landing-page',
          description: 'Landing page has been improved',
          file: 'client/src/pages/home.tsx'
        });
      }
    }
    
    console.log('✅ Landing page analysis complete\n');
  }

  async analyzeStyles() {
    console.log('🎨 Analyzing style changes...');
    
    const newStyles = path.join(this.newVersion, 'client/src/index.css');
    const currentStyles = path.join(this.currentVersion, 'client/src/index.css');
    
    if (fs.existsSync(newStyles) && fs.existsSync(currentStyles)) {
      const newContent = fs.readFileSync(newStyles, 'utf8');
      const currentContent = fs.readFileSync(currentStyles, 'utf8');
      
      if (newContent !== currentContent) {
        this.changes.designChanges.push({
          type: 'styles',
          description: 'CSS styles have been updated',
          file: 'client/src/index.css'
        });
      }
    }
    
    console.log('✅ Style analysis complete\n');
  }

  generateIntegrationPlan() {
    console.log('📋 INTEGRATION PLAN');
    console.log('='.repeat(50));
    
    console.log('\n🆕 NEW FILES TO ADD:');
    this.changes.newFiles.forEach(file => {
      console.log(`  • ${file.path} (${file.type})`);
    });
    
    console.log('\n🧩 NEW FEATURES TO INTEGRATE:');
    this.changes.newFeatures.forEach(feature => {
      console.log(`  • ${feature.name} (${feature.category})`);
    });
    
    console.log('\n🎨 DESIGN CHANGES TO APPLY:');
    this.changes.designChanges.forEach(change => {
      console.log(`  • ${change.description}`);
      console.log(`    File: ${change.file}`);
    });
    
    console.log('\n📝 RECOMMENDED ACTIONS:');
    console.log('  1. Copy new files to current version');
    console.log('  2. Update existing files with improvements');
    console.log('  3. Integrate new components into Browser.tsx');
    console.log('  4. Update local browser design to match web version');
    console.log('  5. Test all integrations');
    
    // Save plan to file
    const plan = {
      timestamp: new Date().toISOString(),
      changes: this.changes,
      recommendations: [
        'Copy new files to current version',
        'Update existing files with improvements', 
        'Integrate new components into Browser.tsx',
        'Update local browser design to match web version',
        'Test all integrations'
      ]
    };
    
    fs.writeFileSync('/workspace/integration-plan.json', JSON.stringify(plan, null, 2));
    console.log('\n💾 Integration plan saved to integration-plan.json');
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const helper = new IntegrationHelper();
  helper.analyzeVersions().then(success => {
    if (success) {
      console.log('\n🎉 Analysis complete! Ready for integration.');
    } else {
      console.log('\n⏳ Waiting for v31 files to be available...');
    }
  }).catch(console.error);
}

export default IntegrationHelper;