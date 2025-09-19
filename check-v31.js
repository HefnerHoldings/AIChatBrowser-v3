import fs from 'fs';
import path from 'path';

console.log('🔍 Checking for v31 files...\n');

const possiblePaths = [
  '/workspace/v31-source',
  '/workspace/v31',
  '/workspace/AIChatBrowser-v3.01',
  '/mnt/c/Users/User/AIChatBrowser-v3/v31',
  '/mnt/c/Users/User/AIChatBrowser-v3'
];

let foundPath = null;

for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    foundPath = testPath;
    console.log(`✅ Found v31 files at: ${testPath}`);
    break;
  }
}

if (!foundPath) {
  console.log('❌ v31 files not found in workspace');
  console.log('\n📋 To proceed, please:');
  console.log('1. Copy v31 folder to workspace');
  console.log('2. Or run: xcopy "C:\\Users\\User\\AIChatBrowser-v3\\v31" "C:\\Users\\User\\AIChatBrowser-v3\\v31-source" /E /I /Y');
  process.exit(1);
}

// Quick analysis
console.log('\n📁 Quick structure analysis:');

function listStructure(dir, prefix = '', maxDepth = 2, currentDepth = 0) {
  if (currentDepth >= maxDepth) return;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items.slice(0, 10)) { // Limit to first 10 items
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const fullPath = path.join(dir, item);
      const isDir = fs.statSync(fullPath).isDirectory();
      
      console.log(`${prefix}${isDir ? '📁' : '📄'} ${item}`);
      
      if (isDir && currentDepth < maxDepth - 1) {
        listStructure(fullPath, prefix + '  ', maxDepth, currentDepth + 1);
      }
    }
  } catch (error) {
    console.log(`${prefix}❌ Error reading directory: ${error.message}`);
  }
}

listStructure(foundPath);

// Check for key files
console.log('\n🔍 Looking for key files:');

const keyFiles = [
  'package.json',
  'client/index.html',
  'client/src/App.tsx',
  'client/src/pages/home.tsx',
  'client/src/pages/Browser.tsx'
];

keyFiles.forEach(file => {
  const fullPath = path.join(foundPath, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} (missing)`);
  }
});

console.log('\n🎉 Ready for detailed analysis!');