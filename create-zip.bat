@echo off
echo Creating ZIP archive of MadEasy Browser installer...

cd dist-installer
powershell -Command "Compress-Archive -Path '.\MadEasyBrowser-Installer\*' -DestinationPath '.\MadEasyBrowser-Complete-Installer.zip' -Force"

if exist "MadEasyBrowser-Complete-Installer.zip" (
    echo ✅ ZIP archive created successfully!
    dir "MadEasyBrowser-Complete-Installer.zip"
) else (
    echo ❌ Failed to create ZIP archive
)

cd ..
pause
