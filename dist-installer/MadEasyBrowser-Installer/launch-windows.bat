@echo off
title MadEasy Browser - Starting...
color 0B

echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │                                                         │
echo  │    ███╗   ███╗ █████╗ ██████╗ ███████╗ █████╗ ███████╗  │
echo  │    ████╗ ████║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝  │
echo  │    ██╔████╔██║███████║██║  ██║█████╗  ███████║███████╗  │
echo  │    ██║╚██╔╝██║██╔══██║██║  ██║██╔══╝  ██╔══██║╚════██║  │
echo  │    ██║ ╚═╝ ██║██║  ██║██████╔╝███████╗██║  ██║███████║  │
echo  │    ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝  │
echo  │                                                         │
echo  │               AI-Powered Web Browser                    │
echo  │                     Version 3.0                        │
echo  └─────────────────────────────────────────────────────────┘
echo.

REM Change to the correct directory
cd /d "%~dp0"

REM Set environment variables
set NODE_ENV=development
set DEBUG=electron

REM Check if Node.js exists
if not exist "node-portable\node-v22.19.0-win-x64\node.exe" (
    echo [ERROR] Node.js not found! 
    echo Please run the installer first or download Node.js.
    pause
    exit /b 1
)

echo [INFO] Setting up environment...
set NODE_EXE=%~dp0node-portable\node-v22.19.0-win-x64\node.exe
set NPM_CMD=%~dp0node-portable\node-v22.19.0-win-x64\npm.cmd

echo [INFO] Starting MadEasy Browser...
echo [INFO] This will open two windows:
echo        1. Development server (keep running)
echo        2. Browser application
echo.

REM Start the development server in background
echo [INFO] Starting development server...
start "MadEasy Server" /min "%NPM_CMD%" run dev

REM Wait a moment for server to start
echo [INFO] Waiting for server to initialize...
timeout /t 8 /nobreak >nul

REM Check if server is running
echo [INFO] Checking server status...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% == 0 (
    echo [SUCCESS] Server is running on http://localhost:5000
) else (
    echo [WARNING] Server may still be starting up...
)

REM Start Electron app
echo [INFO] Launching browser application...
start "MadEasy Browser" "%NODE_EXE%" run-electron.js

echo.
echo [SUCCESS] MadEasy Browser is starting up!
echo.
echo Tips:
echo • The server window should stay open
echo • The browser window will appear shortly
echo • Visit http://localhost:5000 in any browser
echo • Press Ctrl+Shift+I for developer tools
echo.
echo To stop the application:
echo 1. Close the browser window
echo 2. Close the server window
echo.

pause
