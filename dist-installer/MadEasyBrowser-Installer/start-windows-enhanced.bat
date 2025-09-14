@echo off
:: Enhanced Windows Startup Script for MadEasy Browser
:: Automatically handles dependencies and environment setup

setlocal enabledelayedexpansion

echo.
echo ====================================
echo MadEasy Browser V3.00 - Windows
echo ====================================
echo.

:: Check if running in correct directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the MadEasy Browser directory.
    pause
    exit /b 1
)

:: Set environment variables
set NODE_ENV=production
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set MADEASY_BROWSER_VERSION=3.0.0

:: Check for Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Node.js not found in PATH
    echo Attempting to use portable Node.js...
    
    if exist "node-portable\node.exe" (
        set PATH=%CD%\node-portable;!PATH!
        echo Using portable Node.js
    ) else (
        echo ERROR: Node.js not found!
        echo Please install Node.js or place portable version in node-portable folder
        pause
        exit /b 1
    )
) else (
    echo Node.js found: 
    node --version
)

:: Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check for Electron
echo Checking Electron...
if not exist "node_modules\.bin\electron.cmd" (
    echo Installing Electron locally...
    call npm install electron --save-dev
)

:: Create required directories
if not exist "cache" mkdir cache
if not exist "userData" mkdir userData
if not exist "logs" mkdir logs

:: Set up Windows-specific optimizations
echo Setting up Windows optimizations...

:: Enable GPU acceleration
set ELECTRON_ENABLE_GPU=1

:: Set DPI awareness
set ELECTRON_HIGH_DPI_SUPPORT=1

:: Enable Windows notifications
set ELECTRON_ENABLE_NOTIFICATIONS=1

:: Performance optimizations
set UV_THREADPOOL_SIZE=16
set ELECTRON_ENABLE_HEAP_PROFILING=false

:: Security settings for Windows
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set CSP_UNSAFE_INLINE=true

:: Create log file with timestamp
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOGFILE=logs\madeasy-browser-%TIMESTAMP%.log

echo.
echo Starting MadEasy Browser...
echo Log file: %LOGFILE%
echo.

:: Start the browser with enhanced options
if exist "dist\index.html" (
    echo Running production build...
    call npx electron . --production 2>&1 | tee "%LOGFILE%"
) else (
    echo Running development mode...
    call npm run dev 2>&1 | tee "%LOGFILE%"
)

:: Check exit code
if errorlevel 1 (
    echo.
    echo ERROR: Browser exited with error code %errorlevel%
    echo Check log file: %LOGFILE%
    echo.
    pause
)

echo.
echo Browser session ended.
echo.

:: Cleanup temp files
if exist "temp" rmdir /s /q temp

endlocal
pause
