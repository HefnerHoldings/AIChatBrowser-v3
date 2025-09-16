# MadEasy Browser - Advanced Deployment Script
# Handles complete deployment process with multiple options

param(
    [string]$DeploymentType = "local",  # local, github, cloud
    [string]$Version = "1.0.0",
    [switch]$CreateInstaller,
    [switch]$UploadToGitHub,
    [switch]$CreateZip
)

Write-Host "🚀 MadEasy Browser Advanced Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Set location
Set-Location $PSScriptRoot

# 1. Pre-deployment checks
Write-Host "🔍 Pre-deployment checks..." -ForegroundColor Yellow
$checks = @{
    "Node.js" = $false
    "Git" = $false
    "Package.json" = $false
    "Source files" = $false
}

# Check Node.js
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion) {
        $checks["Node.js"] = $true
        Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
} catch {
    # Try portable Node.js
    $portableNode = ".\node-portable\node-v22.19.0-win-x64\node.exe"
    if (Test-Path $portableNode) {
        $env:PATH += ";$(Split-Path $portableNode)"
        $checks["Node.js"] = $true
        Write-Host "  ✅ Node.js: Portable version found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Node.js: Not found" -ForegroundColor Red
    }
}

# Check Git
try {
    git --version >$null 2>&1
    $checks["Git"] = $true
    Write-Host "  ✅ Git: Available" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Git: Not found" -ForegroundColor Red
}

# Check package.json
if (Test-Path "package.json") {
    $checks["Package.json"] = $true
    Write-Host "  ✅ Package.json: Found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Package.json: Missing" -ForegroundColor Red
}

# Check source files
if ((Test-Path "client") -and (Test-Path "server")) {
    $checks["Source files"] = $true
    Write-Host "  ✅ Source files: Found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Source files: Missing" -ForegroundColor Red
}

# 2. Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    try {
        npm install
        Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Dependencies already installed" -ForegroundColor Green
}

# 3. Build project
Write-Host ""
Write-Host "🏗️ Building project..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "  ✅ Build completed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Build failed" -ForegroundColor Red
    exit 1
}

# 4. Create deployment directory
$deployDir = "dist-deployment-$(Get-Date -Format 'yyyyMMdd-HHmm')"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null
Write-Host ""
Write-Host "📁 Created deployment directory: $deployDir" -ForegroundColor Green

# 5. Copy files for deployment
Write-Host ""
Write-Host "📋 Copying deployment files..." -ForegroundColor Yellow

$filesToCopy = @(
    "package.json",
    "README-QUICK-START.md",
    "WINDOWS_FEATURES.md",
    "electron-builder.yml"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item $file $deployDir
        Write-Host "  ✅ Copied: $file" -ForegroundColor Gray
    }
}

# Copy directories
$dirsToCopy = @(
    @{src="dist"; dest="dist"},
    @{src="electron"; dest="electron"},
    @{src="public"; dest="public"}
)

foreach ($dir in $dirsToCopy) {
    if (Test-Path $dir.src) {
        Copy-Item $dir.src "$deployDir\$($dir.dest)" -Recurse
        Write-Host "  ✅ Copied: $($dir.src)" -ForegroundColor Gray
    }
}

# 6. Create installer (if requested)
if ($CreateInstaller) {
    Write-Host ""
    Write-Host "📦 Creating installer..." -ForegroundColor Yellow
    try {
        & ".\create-installer.ps1" -OutputDir "$deployDir\installer" -Version $Version -IncludeNodeJS -CreatePortable
        Write-Host "  ✅ Installer created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Installer creation failed" -ForegroundColor Yellow
    }
}

# 7. Create ZIP package (if requested)
if ($CreateZip) {
    Write-Host ""
    Write-Host "🗜️ Creating ZIP package..." -ForegroundColor Yellow
    $zipName = "MadEasyBrowser-v$Version-$(Get-Date -Format 'yyyyMMdd').zip"
    try {
        Compress-Archive -Path "$deployDir\*" -DestinationPath $zipName -Force
        Write-Host "  ✅ ZIP created: $zipName" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ZIP creation failed" -ForegroundColor Red
    }
}

# 8. Deployment summary
Write-Host ""
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Deployment Type: $DeploymentType" -ForegroundColor White
Write-Host "Version: $Version" -ForegroundColor White
Write-Host "Deployment Directory: $deployDir" -ForegroundColor White

$deploySize = (Get-ChildItem $deployDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Package Size: $([math]::Round($deploySize, 1)) MB" -ForegroundColor White

# 9. Next steps
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test deployment: cd $deployDir && npm start" -ForegroundColor White
Write-Host "2. Upload to server or hosting platform" -ForegroundColor White
Write-Host "3. Share installer files with users" -ForegroundColor White
Write-Host "4. Update documentation and version info" -ForegroundColor White

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
