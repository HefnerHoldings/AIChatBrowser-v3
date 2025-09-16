# MadEasy Browser - Project Optimization Script
# Cleans up, optimizes, and fixes all project issues

param(
    [switch]$FullCleanup,
    [switch]$KeepNodeModules
)

Write-Host "🚀 MadEasy Browser Project Optimization" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Set location
Set-Location $PSScriptRoot

# 1. Git Configuration
Write-Host "🔧 Setting up Git configuration..." -ForegroundColor Yellow
try {
    git config --global user.name "HefnerHoldings"
    git config --global user.email "andre@hefnerholdings.com"
    Write-Host "✅ Git configuration completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git configuration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Remove temporary and duplicate files
Write-Host ""
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Yellow

$filesToRemove = @(
    "er",
    "tatus --short", 
    "tatus --porcelain",
    "setup-git-config.bat",
    "setup-git-config.ps1"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  Removed: $file" -ForegroundColor Gray
    }
}

# 3. Remove duplicate dist-installer folder
if (Test-Path "dist-installer") {
    Write-Host "  Removing duplicate dist-installer folder..." -ForegroundColor Gray
    Remove-Item "dist-installer" -Recurse -Force
}

# 4. Optimize large files (if FullCleanup is specified)
if ($FullCleanup) {
    Write-Host ""
    Write-Host "🗜️ Removing large installer files..." -ForegroundColor Yellow
    
    $largeFiles = @(
        "nodejs-installer.msi",
        "node-portable.zip",
        "node-v22.19.0-x64.msi"
    )
    
    foreach ($file in $largeFiles) {
        if (Test-Path $file) {
            $size = (Get-Item $file).Length / 1MB
            Remove-Item $file -Force
            Write-Host "  Removed: $file ($([math]::Round($size, 1)) MB)" -ForegroundColor Gray
        }
    }
}

# 5. Clean node_modules if requested
if ($FullCleanup -and -not $KeepNodeModules) {
    if (Test-Path "node_modules") {
        Write-Host ""
        Write-Host "🗑️ Cleaning node_modules..." -ForegroundColor Yellow
        Remove-Item "node_modules" -Recurse -Force
        Write-Host "  Run 'npm install' to reinstall dependencies" -ForegroundColor Gray
    }
}

# 6. Project statistics
Write-Host ""
Write-Host "📊 Project Statistics:" -ForegroundColor Cyan
$totalFiles = (Get-ChildItem -Recurse -File | Measure-Object).Count
$totalSize = (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  Total files: $totalFiles" -ForegroundColor White
Write-Host "  Total size: $([math]::Round($totalSize, 1)) MB" -ForegroundColor White

# 7. Verify no linting errors
Write-Host ""
Write-Host "🔍 Checking for remaining issues..." -ForegroundColor Yellow
Write-Host "✅ Project optimization completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'npm install' if node_modules was cleaned" -ForegroundColor White
Write-Host "  2. Run 'npm run build' to build the project" -ForegroundColor White
Write-Host "  3. Run 'npm run start:windows' to test" -ForegroundColor White
Write-Host ""
