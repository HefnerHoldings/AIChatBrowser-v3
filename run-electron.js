#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting MadEasy Browser in Electron mode...');

// Set environment variable
process.env.NODE_ENV = 'development';

// Start Electron
const electron = spawn('npx', ['electron', 'electron-main.js'], {
  stdio: 'inherit',
  env: process.env
});

electron.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
  process.exit(code);
});