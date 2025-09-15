# MadEasy Browser - Complete Installer Creator
# Creates a standalone installer package with all dependencies

param(
    [string]$OutputDir = ".\dist-installer",
    [string]$Version = "3.0.0",
    [switch]$IncludeNodeJS = $true,
    [switch]$CreatePortable = $true,
    [switch]$CreateMSI = $true,
    [switch]$SignInstaller = $false
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "MadEasy Browser Installer Creator" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$FullOutputDir = Resolve-Path $OutputDir

Write-Host "📦 Creating installer package..." -ForegroundColor Yellow
Write-Host "Output directory: $FullOutputDir" -ForegroundColor Gray

# Define files to include in installer
$FilesToPackage = @(
    "package.json",
    "electron\*",
    "attached_assets\*",
    "windows-*.js",
    "windows-*.ps1",
    "*.bat",
    "*.md",
    "run-electron.js",
    "test-windows-features.js"
)

# Create installer structure
$InstallerDir = Join-Path $FullOutputDir "MadEasyBrowser-$Version"
$BinDir = Join-Path $InstallerDir "bin"
$ResourcesDir = Join-Path $InstallerDir "resources"
$NodeDir = Join-Path $InstallerDir "node-portable"

Write-Host "Creating installer directory structure..." -ForegroundColor Yellow

# Create directories
@($InstallerDir, $BinDir, $ResourcesDir, $NodeDir) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

# Copy application files
Write-Host "Copying application files..." -ForegroundColor Yellow
foreach ($pattern in $FilesToPackage) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file.PSIsContainer) {
            Copy-Item -Path $file.FullName -Destination $BinDir -Recurse -Force
        } else {
            Copy-Item -Path $file.FullName -Destination $BinDir -Force
        }
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

# Copy Node.js if available and requested
if ($IncludeNodeJS) {
    Write-Host "Including Node.js runtime..." -ForegroundColor Yellow
    
    $NodeMSI = Get-ChildItem -Name "node-*.msi" | Select-Object -First 1
    if ($NodeMSI) {
        Copy-Item -Path $NodeMSI -Destination $NodeDir -Force
        Write-Host "  ✓ Node.js MSI: $NodeMSI" -ForegroundColor Green
    }
    
    # Check if node-portable exists
    if (Test-Path "node-portable") {
        Copy-Item -Path "node-portable\*" -Destination $NodeDir -Recurse -Force
        Write-Host "  ✓ Portable Node.js included" -ForegroundColor Green
    }
}

# Create enhanced installer script
$InstallerScript = @"
@echo off
setlocal EnableDelayedExpansion

echo.
echo =======================================
echo MadEasy Browser V$Version Installer
echo =======================================
echo.

REM Check Windows version
ver | find "10." >nul
if !errorlevel! == 0 (
    echo ✓ Windows 10 detected
) else (
    ver | find "11." >nul
    if !errorlevel! == 0 (
        echo ✓ Windows 11 detected
    ) else (
        echo ⚠ Warning: This installer is optimized for Windows 10/11
    )
)

REM Get installation directory
set "DEFAULT_PATH=%LOCALAPPDATA%\MadEasy\Browser"
set /p INSTALL_PATH="Installation path [%DEFAULT_PATH%]: "
if "!INSTALL_PATH!"=="" set "INSTALL_PATH=%DEFAULT_PATH%"

echo.
echo Installation path: !INSTALL_PATH!
echo.

REM Create installation directory
if not exist "!INSTALL_PATH!" (
    mkdir "!INSTALL_PATH!" 2>nul
    if !errorlevel! neq 0 (
        echo ❌ Error: Cannot create installation directory
        echo    Please run as Administrator or choose a different path
        pause
        exit /b 1
    )
)

echo 📦 Installing MadEasy Browser...

REM Copy application files
echo   Copying application files...
xcopy /E /Y /Q "bin\*" "!INSTALL_PATH!\" >nul
if !errorlevel! neq 0 (
    echo ❌ Error: Failed to copy application files
    pause
    exit /b 1
)

REM Install Node.js if needed
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo   Node.js not found, installing...
    if exist "node-portable\node-*.msi" (
        echo   Installing Node.js...
        start /wait msiexec /i "node-portable\node-*.msi" /quiet
        echo   ✓ Node.js installed
    ) else if exist "node-portable\node.exe" (
        echo   Setting up portable Node.js...
        xcopy /E /Y /Q "node-portable\*" "!INSTALL_PATH!\node\" >nul
        set "PATH=!INSTALL_PATH!\node;!PATH!"
        echo   ✓ Portable Node.js configured
    ) else (
        echo   ⚠ Node.js not found. Please install Node.js manually.
    )
)

REM Install npm dependencies
echo   Installing dependencies...
cd /d "!INSTALL_PATH!"
if exist "package.json" (
    npm install --production >nul 2>&1
    if !errorlevel! == 0 (
        echo   ✓ Dependencies installed
    ) else (
        echo   ⚠ Warning: Some dependencies may not be installed
    )
)

REM Create shortcuts
echo   Creating shortcuts...

REM Desktop shortcut
set "DESKTOP=%USERPROFILE%\Desktop"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%DESKTOP%\MadEasy Browser.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "!INSTALL_PATH!\start-windows-enhanced.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "!INSTALL_PATH!" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "MadEasy Browser - AI-Powered Web Browser" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript "%TEMP%\CreateShortcut.vbs" >nul 2>&1
del "%TEMP%\CreateShortcut.vbs" >nul 2>&1

REM Start Menu shortcut
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
if not exist "%STARTMENU%\MadEasy" mkdir "%STARTMENU%\MadEasy"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTMENU%\MadEasy\MadEasy Browser.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "!INSTALL_PATH!\start-windows-enhanced.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "!INSTALL_PATH!" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "MadEasy Browser - AI-Powered Web Browser" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript "%TEMP%\CreateShortcut.vbs" >nul 2>&1
del "%TEMP%\CreateShortcut.vbs" >nul 2>&1

echo   ✓ Shortcuts created

REM Register file associations (requires admin)
net session >nul 2>&1
if !errorlevel! == 0 (
    echo   Registering file associations...
    powershell -ExecutionPolicy Bypass -File "!INSTALL_PATH!\windows-installer-enhanced.ps1" -Silent -InstallPath "!INSTALL_PATH!" >nul 2>&1
    echo   ✓ File associations registered
) else (
    echo   ⚠ Administrator rights needed for file associations
    echo     Run 'Register as Default Browser.bat' as admin later
)

REM Create uninstaller
echo   Creating uninstaller...
echo @echo off > "!INSTALL_PATH!\uninstall.bat"
echo echo Uninstalling MadEasy Browser... >> "!INSTALL_PATH!\uninstall.bat"
echo rd /s /q "!INSTALL_PATH!" >> "!INSTALL_PATH!\uninstall.bat"
echo del "%DESKTOP%\MadEasy Browser.lnk" 2^>nul >> "!INSTALL_PATH!\uninstall.bat"
echo rd /s /q "%STARTMENU%\MadEasy" 2^>nul >> "!INSTALL_PATH!\uninstall.bat"
echo echo MadEasy Browser uninstalled. >> "!INSTALL_PATH!\uninstall.bat"
echo pause >> "!INSTALL_PATH!\uninstall.bat"

REM Create admin registration script
echo @echo off > "!INSTALL_PATH!\Register as Default Browser.bat"
echo echo Registering MadEasy Browser as default browser... >> "!INSTALL_PATH!\Register as Default Browser.bat"
echo powershell -ExecutionPolicy Bypass -File "windows-installer-enhanced.ps1" -SetAsDefault -InstallPath "!INSTALL_PATH!" >> "!INSTALL_PATH!\Register as Default Browser.bat"
echo pause >> "!INSTALL_PATH!\Register as Default Browser.bat"

echo.
echo ✅ Installation completed successfully!
echo.
echo Installation directory: !INSTALL_PATH!
echo.
echo 🚀 You can now:
echo   • Use desktop shortcut to start MadEasy Browser
echo   • Find it in Start Menu under 'MadEasy'
echo   • Run 'Register as Default Browser.bat' as admin to set as default
echo.

set /p LAUNCH="Launch MadEasy Browser now? (Y/n): "
if /i "!LAUNCH!"=="Y" (
    start "" "!INSTALL_PATH!\start-windows-enhanced.bat"
) else if "!LAUNCH!"=="" (
    start "" "!INSTALL_PATH!\start-windows-enhanced.bat"
)

echo.
echo Thank you for installing MadEasy Browser! 🎉
pause
"@

$InstallerScript | Out-File -FilePath (Join-Path $InstallerDir "install.bat") -Encoding ASCII

# Create portable version
if ($CreatePortable) {
    Write-Host "Creating portable version..." -ForegroundColor Yellow
    
    $PortableDir = Join-Path $FullOutputDir "MadEasyBrowser-$Version-Portable"
    $PortableBinDir = Join-Path $PortableDir "MadEasyBrowser"
    
    if (!(Test-Path $PortableDir)) {
        New-Item -ItemType Directory -Path $PortableDir -Force | Out-Null
    }
    if (!(Test-Path $PortableBinDir)) {
        New-Item -ItemType Directory -Path $PortableBinDir -Force | Out-Null
    }
    
    # Copy all files to portable version
    Copy-Item -Path "$BinDir\*" -Destination $PortableBinDir -Recurse -Force
    
    # Create portable launcher
    $PortableLauncher = @"
@echo off
echo Starting MadEasy Browser (Portable)...
cd /d "%~dp0MadEasyBrowser"
call start-windows-enhanced.bat
"@
    $PortableLauncher | Out-File -FilePath (Join-Path $PortableDir "MadEasy Browser (Portable).bat") -Encoding ASCII
    
    Write-Host "  ✓ Portable version created" -ForegroundColor Green
}

# Create README for installer
$ReadmeContent = @"
# MadEasy Browser V$Version - Installation Package

## Quick Start
1. Run 'install.bat' to install MadEasy Browser
2. Follow the installation prompts
3. Launch from desktop shortcut or Start Menu

## Installation Options

### Standard Installation
- Run 'install.bat'
- Installs to %LOCALAPPDATA%\MadEasy\Browser
- Creates desktop and Start Menu shortcuts
- Registers file associations (requires admin)

### Portable Installation
- Use the Portable folder
- No installation required
- Run 'MadEasy Browser (Portable).bat'
- All settings stored in portable folder

## System Requirements
- Windows 10 (1903+) or Windows 11
- 4GB RAM (8GB recommended)
- 2GB free disk space
- DirectX 11 compatible graphics

## Features
- AI-powered web browsing
- Advanced security and privacy
- Windows 10/11 integration
- Hardware-accelerated performance
- Enterprise-grade security

## Support
- Documentation: See WINDOWS_FEATURES.md
- Issues: Report via GitHub or support email
- Testing: Run 'test-windows-features.js'

## Version Information
- Version: $Version
- Build Date: $(Get-Date -Format "yyyy-MM-dd")
- Platform: Windows x64

Created by MadEasy Technologies
"@

$ReadmeContent | Out-File -FilePath (Join-Path $InstallerDir "README.txt") -Encoding UTF8

# Create version info file
$VersionInfo = @{
    version = $Version
    buildDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    platform = "Windows"
    architecture = "x64"
    nodeJSIncluded = $IncludeNodeJS
    features = @(
        "Windows Integration",
        "Hardware Acceleration", 
        "Security Features",
        "AI Assistant",
        "Performance Optimization"
    )
} | ConvertTo-Json -Depth 3

$VersionInfo | Out-File -FilePath (Join-Path $InstallerDir "version.json") -Encoding UTF8

# Create installer archive
Write-Host "Creating installer archive..." -ForegroundColor Yellow

$ArchiveName = "MadEasyBrowser-$Version-Windows-Installer.zip"
$ArchivePath = Join-Path $FullOutputDir $ArchiveName

# Use .NET compression if available
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($InstallerDir, $ArchivePath)
    Write-Host "  ✓ Archive created: $ArchiveName" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ .NET compression not available, using PowerShell method..." -ForegroundColor Yellow
    Compress-Archive -Path "$InstallerDir\*" -DestinationPath $ArchivePath -Force
    Write-Host "  ✓ Archive created: $ArchiveName" -ForegroundColor Green
}

# Create self-extracting executable (if makecab is available)
Write-Host "Creating self-extracting installer..." -ForegroundColor Yellow

$SelfExtractingScript = @"
@echo off
echo Extracting MadEasy Browser Installer...
echo.

REM Create temp directory for extraction
set "TEMP_DIR=%TEMP%\MadEasyBrowser-Installer"
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

REM Extract embedded files
(echo Set fso = CreateObject("Scripting.FileSystemObject"^)
echo Set shell = CreateObject("WScript.Shell"^)
echo Set file = fso.OpenTextFile(WScript.Arguments(0^), 1^)
echo content = file.ReadAll
echo file.Close
echo Set outFile = fso.CreateTextFile("%TEMP_DIR%\installer.zip", True^)
echo outFile.Write(Mid(content, InStr(content, "PK"^)^)^)
echo outFile.Close
echo shell.Run "powershell -Command ""Expand-Archive -Path '%TEMP_DIR%\installer.zip' -DestinationPath '%TEMP_DIR%' -Force"", 0, True) > "%TEMP%\extract.vbs"

cscript //nologo "%TEMP%\extract.vbs" "%~f0"
del "%TEMP%\extract.vbs"

REM Run installer
cd /d "%TEMP_DIR%\MadEasyBrowser-$Version"
call install.bat

REM Cleanup
cd /d "%TEMP%"
rd /s /q "%TEMP_DIR%"

goto :EOF

REM Embedded ZIP data follows:
"@

# Combine script with ZIP data to create self-extracting exe
$SelfExtractingPath = Join-Path $FullOutputDir "MadEasyBrowser-$Version-Setup.exe"
$ScriptBytes = [System.Text.Encoding]::ASCII.GetBytes($SelfExtractingScript)
$ZipBytes = [System.IO.File]::ReadAllBytes($ArchivePath)

[System.IO.File]::WriteAllBytes($SelfExtractingPath, $ScriptBytes + $ZipBytes)
Write-Host "  ✓ Self-extracting installer: MadEasyBrowser-$Version-Setup.exe" -ForegroundColor Green

# Generate installation report
$InstallReport = @"
MadEasy Browser V$Version - Installation Package Created
================================================================

Package Contents:
- Standard installer: MadEasyBrowser-$Version\install.bat
- Portable version: MadEasyBrowser-$Version-Portable\
- ZIP archive: $ArchiveName
- Self-extracting: MadEasyBrowser-$Version-Setup.exe

Package Size: $('{0:N2}' -f ((Get-ChildItem $FullOutputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)) MB

Files Included:
$((Get-ChildItem $BinDir -Recurse | ForEach-Object { "  - $($_.Name)" }) -join "`n")

Installation Methods:
1. Self-extracting: Run MadEasyBrowser-$Version-Setup.exe
2. Manual: Extract ZIP and run install.bat
3. Portable: Extract and run portable launcher

Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Platform: Windows 10/11 x64
Node.js: $(if($IncludeNodeJS){'Included'}else{'External'})
"@

$InstallReport | Out-File -FilePath (Join-Path $FullOutputDir "Installation-Report.txt") -Encoding UTF8

Write-Host ""
Write-Host "🎉 Installation package created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Output directory: $FullOutputDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Available packages:" -ForegroundColor White
Write-Host "  • MadEasyBrowser-$Version-Setup.exe (self-extracting)" -ForegroundColor Yellow
Write-Host "  • $ArchiveName (ZIP archive)" -ForegroundColor Yellow
Write-Host "  • MadEasyBrowser-$Version-Portable (portable version)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 To distribute:" -ForegroundColor White
Write-Host "  • Share the self-extracting .exe for easy installation" -ForegroundColor Gray
Write-Host "  • Share the ZIP for manual installation" -ForegroundColor Gray
Write-Host "  • Share the portable folder for no-install usage" -ForegroundColor Gray
Write-Host ""

# Open output directory
$openDir = Read-Host "Open output directory? (Y/n)"
if ($openDir -eq "" -or $openDir -eq "Y" -or $openDir -eq "y") {
    Start-Process explorer.exe $FullOutputDir
}

Write-Host "Installation package creation completed! 🎊" -ForegroundColor Green
"@
