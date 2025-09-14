@echo off
:: Windows Features Test Runner
:: Tests all Windows-specific functionality

echo.
echo ====================================
echo MadEasy Browser - Windows Tests
echo ====================================
echo.

:: Check if running on Windows
if not "%OS%"=="Windows_NT" (
    echo ERROR: This test suite requires Windows
    pause
    exit /b 1
)

:: Set environment variables
set NODE_ENV=test
set ELECTRON_DISABLE_SECURITY_WARNINGS=true

:: Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js to run tests
    pause
    exit /b 1
)

:: Check if in correct directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the MadEasy Browser directory.
    pause
    exit /b 1
)

:: Install test dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Running Windows Features Tests...
echo.

:: Run the test suite
node test-windows-features.js

:: Check test results
if exist "test-results-windows.json" (
    echo.
    echo Test results saved to test-results-windows.json
    echo.
    
    :: Ask to view results
    set /p view="View test results in browser? (Y/n): "
    if /i "%view%"=="Y" (
        start test-results-windows.json
    ) else if "%view%"=="" (
        start test-results-windows.json
    )
)

echo.
echo Tests completed. Check output above for results.
echo.
pause
