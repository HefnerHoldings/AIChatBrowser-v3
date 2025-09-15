# Simple MadEasy Browser Packager
param(
    [string]$OutputDir = ".\dist-installer"
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "MadEasy Browser Simple Packager" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$FullOutputDir = Resolve-Path $OutputDir
Write-Host "Output: $FullOutputDir" -ForegroundColor Yellow

# Create installer directory
$InstallerDir = Join-Path $FullOutputDir "MadEasyBrowser-Installer"
if (!(Test-Path $InstallerDir)) {
    New-Item -ItemType Directory -Path $InstallerDir -Force | Out-Null
}

Write-Host "Copying files..." -ForegroundColor Yellow

# Copy main files
$FilesToCopy = @(
    "package.json",
    "*.js",
    "*.bat",
    "*.md",
    "*.ps1"
)

foreach ($pattern in $FilesToCopy) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Copy-Item -Path $file.FullName -Destination $InstallerDir -Force
        Write-Host "  + $($file.Name)" -ForegroundColor Green
    }
}

# Copy directories
$DirsTooCopy = @("electron", "attached_assets")
foreach ($dir in $DirsTooCopy) {
    if (Test-Path $dir) {
        Copy-Item -Path $dir -Destination $InstallerDir -Recurse -Force
        Write-Host "  + $dir\" -ForegroundColor Green
    }
}

# Copy Node.js installer if available
$NodeMSI = Get-ChildItem -Name "node-*.msi" | Select-Object -First 1
if ($NodeMSI) {
    Copy-Item -Path $NodeMSI -Destination $InstallerDir -Force
    Write-Host "  + $NodeMSI" -ForegroundColor Green
}

# Create simple installer script
$SimpleInstaller = @'
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
'@

$SimpleInstaller | Out-File -FilePath (Join-Path $InstallerDir "install.bat") -Encoding ASCII

# Create README
$ReadmeText = @"
MadEasy Browser Installer Package

Quick Start:
1. Run install.bat to install
2. Use desktop shortcut to launch

Files included:
- Browser source code
- Windows optimizations
- Node.js installer (if available)
- Documentation

Installation creates:
- Installation in %LOCALAPPDATA%\MadEasy\Browser
- Desktop shortcut
- Automatic Node.js setup

System Requirements:
- Windows 10/11
- 4GB RAM recommended
- 2GB disk space
"@

$ReadmeText | Out-File -FilePath (Join-Path $InstallerDir "README.txt") -Encoding UTF8

# Create ZIP archive
Write-Host "Creating ZIP archive..." -ForegroundColor Yellow
$ZipPath = Join-Path $FullOutputDir "MadEasyBrowser-Installer.zip"

try {
    Compress-Archive -Path "$InstallerDir\*" -DestinationPath $ZipPath -Force
    Write-Host "  + MadEasyBrowser-Installer.zip" -ForegroundColor Green
} catch {
    Write-Host "  ! ZIP creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Package created successfully!" -ForegroundColor Green
Write-Host "Location: $FullOutputDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files created:" -ForegroundColor White
Write-Host "  • MadEasyBrowser-Installer\ (folder)" -ForegroundColor Yellow
Write-Host "  • MadEasyBrowser-Installer.zip (archive)" -ForegroundColor Yellow
Write-Host ""

# Show package size
$PackageSize = (Get-ChildItem $FullOutputDir -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host "Package size: $([math]::Round($PackageSize / 1MB, 2)) MB" -ForegroundColor Gray

Write-Host "Packaging completed!" -ForegroundColor Green
