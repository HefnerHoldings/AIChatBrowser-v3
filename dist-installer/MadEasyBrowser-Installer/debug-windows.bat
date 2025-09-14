@echo off
title AIChatBrowser - Windows Debug Console
color 0A

echo.
echo ===============================================
echo    AIChatBrowser Windows Debug Console
echo ===============================================
echo.

REM Set debug environment
set NODE_ENV=development
set ELECTRON_ENABLE_LOGGING=1
set DEBUG=*

REM Change to correct directory
cd /d "%~dp0"

:MENU
echo.
echo [1] Start Development Server Only
echo [2] Start Electron App Only  
echo [3] Start Both (Full Application)
echo [4] View Server Logs
echo [5] View Process Status
echo [6] Kill All Processes
echo [7] Run System Diagnostics
echo [8] Build Production Version
echo [9] Exit
echo.
set /p choice="Select an option (1-9): "

if "%choice%"=="1" goto START_SERVER
if "%choice%"=="2" goto START_ELECTRON
if "%choice%"=="3" goto START_BOTH
if "%choice%"=="4" goto VIEW_LOGS
if "%choice%"=="5" goto PROCESS_STATUS
if "%choice%"=="6" goto KILL_PROCESSES
if "%choice%"=="7" goto DIAGNOSTICS
if "%choice%"=="8" goto BUILD_PROD
if "%choice%"=="9" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:START_SERVER
echo.
echo [INFO] Starting development server...
start "AIChatBrowser Server" cmd /k ""%~dp0node-portable\node-v22.19.0-win-x64\npm.cmd" run dev"
echo [SUCCESS] Server started in new window
goto MENU

:START_ELECTRON
echo.
echo [INFO] Starting Electron app...
start "AIChatBrowser App" cmd /k ""%~dp0node-portable\node-v22.19.0-win-x64\node.exe" run-electron.js"
echo [SUCCESS] Electron app started in new window
goto MENU

:START_BOTH
echo.
echo [INFO] Starting full application...
call :START_SERVER
timeout /t 3 /nobreak >nul
call :START_ELECTRON
goto MENU

:VIEW_LOGS
echo.
echo [INFO] Recent server activity:
echo =====================================
netstat -an | find "5000"
echo.
if exist "logs\app.log" (
    echo Last 10 lines from app.log:
    powershell "Get-Content 'logs\app.log' | Select-Object -Last 10"
) else (
    echo No log file found.
)
echo.
pause
goto MENU

:PROCESS_STATUS
echo.
echo [INFO] Current process status:
echo =====================================
echo.
echo Node.js processes:
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe"
if %errorlevel% neq 0 echo No Node.js processes found.
echo.
echo Electron processes:
tasklist /fi "imagename eq electron.exe" 2>nul | find "electron.exe"
if %errorlevel% neq 0 echo No Electron processes found.
echo.
echo Port 5000 usage:
netstat -ano | find "5000"
if %errorlevel% neq 0 echo Port 5000 is not in use.
echo.
pause
goto MENU

:KILL_PROCESSES
echo.
echo [WARNING] This will kill all Node.js and Electron processes!
set /p confirm="Are you sure? (Y/N): "
if /i "%confirm%"=="Y" (
    echo Killing Node.js processes...
    taskkill /f /im node.exe 2>nul
    echo Killing Electron processes...
    taskkill /f /im electron.exe 2>nul
    echo [SUCCESS] All processes terminated.
) else (
    echo [CANCELLED] No processes were killed.
)
goto MENU

:DIAGNOSTICS
echo.
echo [INFO] Running system diagnostics...
echo =====================================
echo.
echo System Information:
echo OS: %OS%
echo Processor: %PROCESSOR_IDENTIFIER%
echo.
echo Node.js Installation:
if exist "node-portable\node-v22.19.0-win-x64\node.exe" (
    "node-portable\node-v22.19.0-win-x64\node.exe" --version
    echo NPM Version:
    "node-portable\node-v22.19.0-win-x64\npm.cmd" --version
) else (
    echo [ERROR] Node.js not found!
)
echo.
echo Project Files:
if exist "package.json" (echo ✓ package.json) else (echo ✗ package.json)
if exist "electron\main.js" (echo ✓ electron\main.js) else (echo ✗ electron\main.js)
if exist "run-electron.js" (echo ✓ run-electron.js) else (echo ✗ run-electron.js)
if exist "client\index.html" (echo ✓ client\index.html) else (echo ✗ client\index.html)
echo.
echo Network Test:
curl -s -I http://localhost:5000 2>nul | find "200" >nul
if %errorlevel% == 0 (
    echo ✓ Server is responding on port 5000
) else (
    echo ✗ Server not responding on port 5000
)
echo.
pause
goto MENU

:BUILD_PROD
echo.
echo [INFO] Building production version...
echo This may take several minutes...
echo.
"%~dp0node-portable\node-v22.19.0-win-x64\npm.cmd" run build
if %errorlevel% == 0 (
    echo [SUCCESS] Build completed successfully!
    echo Built files are in the 'dist' directory.
) else (
    echo [ERROR] Build failed! Check the output above for errors.
)
echo.
pause
goto MENU

:EXIT
echo.
echo [INFO] Goodbye! Thanks for using AIChatBrowser.
echo.
pause
exit /b 0
