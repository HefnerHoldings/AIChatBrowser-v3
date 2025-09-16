@echo off
echo ========================================
echo   MADEASY BROWSER - CLEANUP SCRIPT
echo ========================================
echo.

cd /d "%~dp0"

echo 🧹 Cleaning up project...
echo.

REM Remove dist-installer folder
if exist "dist-installer" (
    echo Removing dist-installer folder...
    rmdir /s /q "dist-installer"
    echo ✅ dist-installer removed
) else (
    echo ℹ️ dist-installer not found
)

REM Remove temporary PowerShell script
if exist "remove-duplicates.ps1" (
    del /q "remove-duplicates.ps1"
    echo ✅ Temporary script removed
)

echo.
echo 🔧 Setting up Git configuration...
git config --global user.name "HefnerHoldings" 2>nul
git config --global user.email "andre@hefnerholdings.com" 2>nul
echo ✅ Git configuration completed

echo.
echo 📊 Project status:
dir /b | find /c /v "" > temp.txt
set /p filecount=<temp.txt
del temp.txt
echo   Files in root: %filecount%

echo.
echo ✅ CLEANUP COMPLETED SUCCESSFULLY!
echo.
echo 🎯 Next steps:
echo   1. Run: npm install
echo   2. Run: npm run dev
echo   3. Test: npm run start:windows
echo.
pause
