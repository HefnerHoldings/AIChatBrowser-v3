@echo off
:: Package MadEasy Browser Installer
:: Creates complete installation package with all dependencies

echo.
echo ==========================================
echo MadEasy Browser - Installer Packager
echo ==========================================
echo.

:: Check if in correct directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the MadEasy Browser directory.
    pause
    exit /b 1
)

:: Set PowerShell execution policy for current session
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force"

echo 📦 Creating installer package...
echo.

:: Run the installer creator
powershell -ExecutionPolicy Bypass -File "create-installer.ps1" -IncludeNodeJS -CreatePortable -OutputDir "dist-installer"

:: Check if successful
if exist "dist-installer" (
    echo.
    echo ✅ Installer package created successfully!
    echo.
    echo 📁 Check the 'dist-installer' folder for:
    echo   • Self-extracting installer (.exe)
    echo   • ZIP archive
    echo   • Portable version
    echo.
) else (
    echo.
    echo ❌ Failed to create installer package
    echo Check the error messages above
    echo.
)

pause
