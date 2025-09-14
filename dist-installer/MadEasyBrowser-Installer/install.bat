@echo off
echo Installing MadEasy Browser...

set "INSTALL_PATH=%LOCALAPPDATA%\MadEasy\Browser"
echo Installation path: %INSTALL_PATH%

if not exist "%INSTALL_PATH%" mkdir "%INSTALL_PATH%"

echo Copying files...
xcopy /E /Y /Q *.* "%INSTALL_PATH%\" >nul

echo Installing Node.js if needed...
node --version >nul 2>&1
if errorlevel 1 (
    if exist "node-*.msi" (
        echo Installing Node.js...
        for %%f in (node-*.msi) do start /wait msiexec /i "%%f" /quiet
    )
)

echo Creating shortcuts...
set "DESKTOP=%USERPROFILE%\Desktop"
echo @echo off > "%DESKTOP%\MadEasy Browser.bat"
echo cd /d "%INSTALL_PATH%" >> "%DESKTOP%\MadEasy Browser.bat"
echo start-windows-enhanced.bat >> "%DESKTOP%\MadEasy Browser.bat"

echo Installation completed!
echo Desktop shortcut created: MadEasy Browser.bat
pause
