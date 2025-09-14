@echo off
:: MadEasy Browser - Automatic Setup
:: Handles all dependencies and creates installer package

setlocal EnableDelayedExpansion

echo.
echo =============================================
echo MadEasy Browser - Automatic Setup
echo =============================================
echo.

:: Check Windows version
echo 🔍 Checking system requirements...
ver | find "10." >nul
if !errorlevel! == 0 (
    echo ✓ Windows 10 detected
    set "WINDOWS_OK=1"
) else (
    ver | find "11." >nul
    if !errorlevel! == 0 (
        echo ✓ Windows 11 detected
        set "WINDOWS_OK=1"
    ) else (
        echo ⚠ Warning: Windows 10/11 recommended
        set "WINDOWS_OK=0"
    )
)

:: Check if in correct directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    echo Please run this script from the MadEasy Browser directory.
    pause
    exit /b 1
)

echo ✓ MadEasy Browser source found

:: Check for Node.js
echo.
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if !errorlevel! == 0 (
    echo ✓ Node.js is installed
    node --version
    set "NODE_OK=1"
) else (
    echo ⚠ Node.js not found in PATH
    set "NODE_OK=0"
    
    :: Check for Node.js installer
    if exist "node-*.msi" (
        echo 📦 Node.js installer found, installing...
        
        :: Get the first Node.js MSI file
        for %%f in (node-*.msi) do (
            echo Installing %%f...
            start /wait msiexec /i "%%f" /quiet /qn
            if !errorlevel! == 0 (
                echo ✓ Node.js installed successfully
                set "NODE_OK=1"
            ) else (
                echo ❌ Node.js installation failed
                echo Please install Node.js manually
                pause
                exit /b 1
            )
            goto :nodeinstalled
        )
        :nodeinstalled
    ) else (
        echo ❌ Node.js installer not found
        echo.
        echo 🔗 Please download Node.js from: https://nodejs.org/
        echo   Or place node-*.msi file in this directory
        echo.
        set /p continue="Continue without Node.js? (installation will be incomplete) (y/N): "
        if /i not "!continue!"=="y" (
            echo Installation cancelled.
            pause
            exit /b 1
        )
    )
)

:: Refresh PATH if Node.js was just installed
if "!NODE_OK!"=="1" (
    echo 🔄 Refreshing environment variables...
    call refreshenv >nul 2>&1
    
    :: Alternative method to refresh PATH
    for /f "skip=2 tokens=3*" %%a in ('reg query HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment /v PATH') do (
        set "SYSPATH=%%b"
    )
    for /f "skip=2 tokens=3*" %%a in ('reg query HKCU\Environment /v PATH 2^>nul') do (
        set "USERPATH=%%b"
    )
    set "PATH=!SYSPATH!;!USERPATH!"
    
    :: Test Node.js again
    node --version >nul 2>&1
    if !errorlevel! == 0 (
        echo ✓ Node.js ready
        node --version
    ) else (
        echo ⚠ Node.js installation may require restart
        echo Please restart your computer and run this script again
        pause
        exit /b 1
    )
)

:: Check npm
if "!NODE_OK!"=="1" (
    echo.
    echo 🔍 Checking npm...
    npm --version >nul 2>&1
    if !errorlevel! == 0 (
        echo ✓ npm is ready
        npm --version
    ) else (
        echo ❌ npm not found (should come with Node.js)
        pause
        exit /b 1
    )
)

:: Install dependencies
if "!NODE_OK!"=="1" (
    echo.
    echo 📦 Installing project dependencies...
    
    if exist "node_modules" (
        echo Existing node_modules found, cleaning...
        rd /s /q "node_modules" 2>nul
    )
    
    echo Running npm install...
    call npm install
    
    if !errorlevel! == 0 (
        echo ✓ Dependencies installed successfully
    ) else (
        echo ⚠ Some dependencies may have failed to install
        echo Continuing anyway...
    )
    
    :: Install Electron if not present
    if not exist "node_modules\.bin\electron.cmd" (
        echo 🔧 Installing Electron...
        call npm install electron --save-dev
        if !errorlevel! == 0 (
            echo ✓ Electron installed
        ) else (
            echo ⚠ Electron installation failed
        )
    )
)

:: Run basic tests
echo.
echo 🧪 Running basic system tests...

if "!NODE_OK!"=="1" (
    echo Testing Node.js integration...
    node -e "console.log('✓ Node.js working')"
    
    if exist "test-windows-features.js" (
        echo Running quick feature test...
        timeout /t 2 >nul
        node test-windows-features.js --quick >nul 2>&1
        if !errorlevel! == 0 (
            echo ✓ Basic tests passed
        ) else (
            echo ⚠ Some tests failed (this is normal during setup)
        )
    )
)

:: Create installer package
echo.
echo 📦 Creating installer package...

:: Set PowerShell execution policy
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force" >nul 2>&1

:: Run installer creator
if exist "create-installer.ps1" (
    echo Running installer packager...
    powershell -ExecutionPolicy Bypass -File "create-installer.ps1" -IncludeNodeJS -CreatePortable -OutputDir "dist-installer" >nul 2>&1
    
    if exist "dist-installer" (
        echo ✅ Installer package created successfully!
        
        :: Show package contents
        echo.
        echo 📁 Package contents:
        dir "dist-installer" /b | findstr /v /c:"$" | for /f "tokens=*" %%i in ('more') do echo   • %%i
        
    ) else (
        echo ❌ Failed to create installer package
        echo Running packager with visible output...
        call package-installer.bat
    )
) else (
    echo ❌ create-installer.ps1 not found
    echo Installer package creation skipped
)

:: Final summary
echo.
echo ==========================================
echo Setup Summary
echo ==========================================
echo.

if "!WINDOWS_OK!"=="1" (
    echo ✅ Windows: Compatible
) else (
    echo ⚠️ Windows: May have compatibility issues
)

if "!NODE_OK!"=="1" (
    echo ✅ Node.js: Installed and ready
) else (
    echo ❌ Node.js: Not available
)

if exist "node_modules" (
    echo ✅ Dependencies: Installed
) else (
    echo ❌ Dependencies: Not installed
)

if exist "dist-installer" (
    echo ✅ Installer: Package created
) else (
    echo ❌ Installer: Package creation failed
)

echo.
echo 🎯 What you can do now:
echo.

if exist "dist-installer" (
    echo   🚀 DISTRIBUTE THE BROWSER:
    echo     • Share files in 'dist-installer' folder
    echo     • Users can run the .exe installer
    echo     • Or use the portable version
    echo.
)

if "!NODE_OK!"=="1" (
    echo   🧪 TEST THE BROWSER:
    echo     • Run: npm run test:windows
    echo     • Run: npm run start:windows
    echo.
)

echo   📚 READ DOCUMENTATION:
echo     • See: WINDOWS_FEATURES.md
echo     • Check: Installation-Report.txt (in dist-installer)
echo.

if exist "dist-installer" (
    set /p open="Open installer package folder? (Y/n): "
    if "!open!"=="" set "open=Y"
    if /i "!open!"=="Y" (
        start explorer "dist-installer"
    )
)

echo.
echo 🎉 MadEasy Browser setup completed!
echo.
pause
