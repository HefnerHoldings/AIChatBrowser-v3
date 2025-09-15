#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine if we're in development or production
const isDev = process.env.NODE_ENV !== 'production';

console.log('=================================');
console.log('MadEasy Browser V3.00 - Electron');
console.log('=================================');
console.log(`Mode: ${isDev ? 'Development' : 'Production'}`);
console.log('');

// Function to check if the server is ready
function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkServer = () => {
      const http = require('http');
      const urlObj = new URL(url);
      
      const req = http.get({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname
      }, (res) => {
        console.log('✓ Server is ready');
        resolve();
      });
      
      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Server startup timeout'));
        } else {
          setTimeout(checkServer, 500);
        }
      });
      
      req.end();
    };
    
    checkServer();
  });
}

// Start the backend server first
console.log('🚀 Starting backend server...');

const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ELECTRON: 'true' }
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Wait for server to be ready
console.log('⏳ Waiting for server to be ready...');

setTimeout(() => {
  waitForServer('http://localhost:5000', 30000)
    .then(() => {
      console.log('\n⚡ Launching Electron...\n');
      
      const electronPath = require('electron');
      const mainPath = path.join(__dirname, 'electron', 'main.js');
      
      // Check if main file exists
      if (!fs.existsSync(mainPath)) {
        console.error(`Electron main file not found: ${mainPath}`);
        console.log('Creating default electron main file...');
        
        // If in production mode without main file, exit
        if (!isDev) {
          console.error('Cannot run production build without Electron main file');
          process.exit(1);
        }
      }
      
      const electronProcess = spawn(electronPath, [mainPath], {
        stdio: 'inherit',
        shell: false,
        env: {
          ...process.env,
          NODE_ENV: isDev ? 'development' : 'production',
          ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
        }
      });

      electronProcess.on('close', (code) => {
        console.log(`\nElectron exited with code ${code}`);
        serverProcess.kill();
        process.exit(code);
      });
      
      electronProcess.on('error', (error) => {
        console.error('Failed to start Electron:', error);
        serverProcess.kill();
        process.exit(1);
      });
      
      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\n👋 Shutting down gracefully...');
        electronProcess.kill();
        serverProcess.kill();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.log('\n⛔ Terminating...');
        electronProcess.kill();
        serverProcess.kill();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('Server failed to start:', error);
      serverProcess.kill();
      process.exit(1);
    });
}, 3000);