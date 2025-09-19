@echo off
:: Copy v31 files to workspace for analysis
echo Copying v31 files to workspace...

set "SOURCE=C:\Users\User\AIChatBrowser-v3\v31"
set "DESTINATION=C:\Users\User\AIChatBrowser-v3\v31-source"

if not exist "%SOURCE%" (
    echo ERROR: Source directory not found: %SOURCE%
    echo Please make sure v31 files are in the correct location
    pause
    exit /b 1
)

echo Copying files from %SOURCE% to %DESTINATION%...
xcopy "%SOURCE%" "%DESTINATION%" /E /I /Y

if %errorlevel% == 0 (
    echo ✅ Files copied successfully!
    echo You can now run the integration analysis
) else (
    echo ❌ Error copying files
)

pause