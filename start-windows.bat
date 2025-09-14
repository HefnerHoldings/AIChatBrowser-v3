@echo off
echo.
echo  ███╗   ███╗ █████╗ ██████╗ ███████╗ █████╗ ███████╗██╗   ██╗
echo  ████╗ ████║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝
echo  ██╔████╔██║███████║██║  ██║█████╗  ███████║███████╗ ╚████╔╝ 
echo  ██║╚██╔╝██║██╔══██║██║  ██║██╔══╝  ██╔══██║╚════██║  ╚██╔╝  
echo  ██║ ╚═╝ ██║██║  ██║██████╔╝███████╗██║  ██║███████║   ██║   
echo  ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   
echo.
echo                  AIChatBrowser v3.0 - Windows Edition
echo                     Starting your AI-powered browser...
echo.

REM Set environment variables
set NODE_ENV=development
set ELECTRON_ENABLE_LOGGING=1

REM Change to correct directory
cd /d "%~dp0"

REM Check if Node.js is available
if exist "node-portable\node-v22.19.0-win-x64\node.exe" (
    set NODE_PATH=%~dp0node-portable\node-v22.19.0-win-x64
    set NPM_PATH=%~dp0node-portable\node-v22.19.0-win-x64\npm.cmd
    echo [INFO] Using portable Node.js...
) else (
    echo [ERROR] Node.js not found! Please run the setup first.
    pause
    exit /b 1
)

REM Check if server is already running
echo [INFO] Checking if server is already running...
netstat -an | find "5000" >nul
if %errorlevel% == 0 (
    echo [INFO] Development server is already running on port 5000
) else (
    echo [INFO] Starting development server...
    start "AIChatBrowser Server" /min "%NPM_PATH%" run dev
    
    REM Wait for server to start
    echo [INFO] Waiting for server to initialize...
    timeout /t 5 /nobreak >nul
)

REM Check if Electron is already running
tasklist /fi "imagename eq electron.exe" 2>nul | find "electron.exe" >nul
if %errorlevel% == 0 (
    echo [INFO] Electron app is already running
    echo [INFO] Bringing window to front...
    powershell -command "(New-Object -comObject Shell.Application).Windows() | Where-Object {$_.LocationName -like '*MadEasy Browser*'} | ForEach-Object {$_.Visible = $true}"
) else (
    echo [INFO] Starting Electron app...
    start "AIChatBrowser" "%NODE_PATH%\node.exe" run-electron.js
)

echo.
echo [SUCCESS] AIChatBrowser is starting!
echo.
echo Server URL: http://localhost:5000
echo.
echo Press any key to view logs or close this window...
pause >nul

REM Show logs
echo.
echo [INFO] Showing recent logs...
if exist "logs\app.log" (
    type "logs\app.log" | tail -n 20
) else (
    echo No log file found.
)

pause
