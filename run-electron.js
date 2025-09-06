#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MadEasy Browser with Electron...\n');

// Start the backend server first
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for the server to start, then launch Electron
setTimeout(() => {
  console.log('\n⚡ Launching Electron...\n');
  
  const electronProcess = spawn('npx', ['electron', 'electron/main.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
    serverProcess.kill();
    process.exit(code);
  });
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  serverProcess.kill();
  process.exit();
});