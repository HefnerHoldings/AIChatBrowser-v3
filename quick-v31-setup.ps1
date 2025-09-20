# PowerShell script for quick v31 setup
Write-Host "🚀 AIChatBrowser v3.01 Quick Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Set location
Set-Location "C:\Users\User\AIChatBrowser-v3"
Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Process v31 folder
if (Test-Path "v31") {
    Write-Host "✅ Found v31 folder" -ForegroundColor Green
    
    if (Test-Path "v31-source") {
        Remove-Item "v31-source" -Recurse -Force
        Write-Host "🧹 Cleaned existing v31-source" -ForegroundColor Yellow
    }
    
    Copy-Item "v31" "v31-source" -Recurse -Force
    Write-Host "📋 Copied v31 → v31-source" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ v31 folder not found" -ForegroundColor Red
}

# Process ZIP file
if (Test-Path "AIChatBrowser (1).zip") {
    Write-Host "✅ Found AIChatBrowser (1).zip" -ForegroundColor Green
    
    # Clean up previous extraction
    if (Test-Path "v31-zip-source") {
        Remove-Item "v31-zip-source" -Recurse -Force
        Write-Host "🧹 Cleaned existing v31-zip-source" -ForegroundColor Yellow
    }
    
    if (Test-Path "temp-extract") {
        Remove-Item "temp-extract" -Recurse -Force
    }
    
    # Extract ZIP
    Write-Host "📦 Extracting ZIP file..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "temp-extract" -Force | Out-Null
    Expand-Archive -Path "AIChatBrowser (1).zip" -DestinationPath "temp-extract" -Force
    
    # Find main folder and copy
    $extractedFolders = Get-ChildItem "temp-extract" -Directory
    if ($extractedFolders.Count -gt 0) {
        $mainFolder = $extractedFolders[0].FullName
        Write-Host "📁 Found main folder: $($extractedFolders[0].Name)" -ForegroundColor Gray
        Copy-Item $mainFolder "v31-zip-source" -Recurse -Force
    } else {
        # Copy all files if no main folder
        Copy-Item "temp-extract\*" "v31-zip-source" -Recurse -Force
    }
    
    # Cleanup
    Remove-Item "temp-extract" -Recurse -Force
    Write-Host "📋 Extracted and copied ZIP → v31-zip-source" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ AIChatBrowser (1).zip not found" -ForegroundColor Red
}

# Summary
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if (Test-Path "v31-source") {
    Write-Host "✅ v31-source created (from v31 folder)" -ForegroundColor Green
    $items = Get-ChildItem "v31-source" | Select-Object -First 10
    foreach ($item in $items) {
        Write-Host "   📄 $($item.Name)" -ForegroundColor Gray
    }
    Write-Host ""
}

if (Test-Path "v31-zip-source") {
    Write-Host "✅ v31-zip-source created (from ZIP file)" -ForegroundColor Green
    $items = Get-ChildItem "v31-zip-source" | Select-Object -First 10
    foreach ($item in $items) {
        Write-Host "   📄 $($item.Name)" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "🎉 Setup complete! Ready for integration analysis." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next: Run integration analysis to compare versions" -ForegroundColor Cyan

Read-Host "Press Enter to continue"