@echo off
echo === AICHATBROWSER ANDROID SETUP ===
echo.

echo 1. Starter Android Studio med prosjektet...
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0"

echo.
echo 2. Venter 5 sekunder...
timeout /t 5 /nobreak > nul

echo.
echo 3. Starter server i nytt vindu...
start "AIChatBrowser Server" cmd /k "cd /d C:\Users\post\Downloads\AIChatBrowser\AIChatBrowser && echo === STARTER SERVER === && npm run dev"

echo.
echo === INSTRUKSJONER ===
echo 1. Vent til Android Studio har åpnet prosjektet
echo 2. Opprett emulator: Device Manager -> Create Virtual Device
echo 3. Velg Pixel 4, API Level 30+
echo 4. Start emulatoren
echo 5. Klikk Run-knappen (grønn play) i Android Studio
echo.
echo Server vil være tilgjengelig på: http://localhost:5000
echo.
pause
