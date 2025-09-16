@echo off
echo ========================================
echo   MADEASY BROWSER - DEPLOYMENT SCRIPT
echo ========================================
echo.

cd /d "%~dp0"

echo 🚀 Starting MadEasy Browser Deployment...
echo.

REM Set Node.js path
set PATH=%PATH%;%CD%\node-portable\node-v22.19.0-win-x64

echo 🔧 Step 1: Setting up Git configuration...
git config --global user.name "HefnerHoldings" 2>nul
git config --global user.email "andre@hefnerholdings.com" 2>nul
echo ✅ Git configuration completed

echo.
echo 📦 Step 2: Installing dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🏗️ Step 3: Building project...
echo Building for production...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Build completed

echo.
echo 📱 Step 4: Creating Windows installer...
echo Running installer creator...
powershell -ExecutionPolicy Bypass -File "create-installer.ps1" -IncludeNodeJS -CreatePortable -OutputDir "dist-deployment"
if errorlevel 1 (
    echo ⚠️ Installer creation had issues, but continuing...
) else (
    echo ✅ Installer created successfully
)

echo.
echo 🎯 Step 5: Creating deployment package...
if not exist "dist-deployment" mkdir "dist-deployment"

REM Copy essential files for deployment
echo Copying deployment files...
copy "package.json" "dist-deployment\" >nul 2>&1
copy "README-QUICK-START.md" "dist-deployment\" >nul 2>&1
copy "WINDOWS_FEATURES.md" "dist-deployment\" >nul 2>&1

if exist "dist" (
    xcopy "dist" "dist-deployment\dist\" /E /I /Q >nul 2>&1
    echo ✅ Built files copied
)

echo.
echo 📊 Deployment Summary:
echo ========================================
if exist "dist-deployment" (
    echo ✅ Deployment folder: dist-deployment
    dir "dist-deployment" /b | find /c /v "" > temp.txt
    set /p filecount=<temp.txt
    del temp.txt
    echo ✅ Files in deployment: %filecount%
) else (
    echo ❌ Deployment folder not created
)

echo.
echo 🎉 DEPLOYMENT COMPLETED!
echo.
echo 📋 Next steps:
echo   1. Test locally: npm run start
echo   2. Deploy folder: dist-deployment
echo   3. Share installer files with users
echo   4. Upload to server or distribution platform
echo.
echo 🌐 Deployment options:
echo   • Local network deployment
echo   • Cloud hosting (AWS, Azure, etc.)
echo   • GitHub Releases
echo   • Direct file sharing
echo.
pause
