const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  console.log('After pack hook running...');
  
  const { electronPlatformName, appOutDir } = context;
  
  // Platform-specific post-processing
  switch(electronPlatformName) {
    case 'win32':
      console.log('Windows post-pack processing...');
      // Add Windows-specific processing here
      break;
    case 'darwin':
      console.log('macOS post-pack processing...');
      // Add macOS-specific processing here
      break;
    case 'linux':
      console.log('Linux post-pack processing...');
      // Add Linux-specific processing here
      break;
  }
  
  // Ensure necessary files are included
  const resourcesPath = path.join(appOutDir, 'resources');
  if (!fs.existsSync(resourcesPath)) {
    fs.mkdirSync(resourcesPath, { recursive: true });
  }
  
  console.log('After pack hook completed');
};