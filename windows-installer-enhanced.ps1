# Enhanced Windows Installer for MadEasy Browser
# Requires PowerShell 5.0+ and Administrator privileges

param(
    [switch]$Silent,
    [switch]$PortableInstall,
    [string]$InstallPath = "$env:LOCALAPPDATA\MadEasy\Browser",
    [switch]$SetAsDefault,
    [switch]$CreateShortcuts
)

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Create application directories
function New-AppDirectories {
    param([string]$BasePath)
    
    $directories = @(
        $BasePath,
        "$BasePath\resources",
        "$BasePath\cache",
        "$BasePath\userData",
        "$BasePath\extensions",
        "$BasePath\themes"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "Created directory: $dir" -ForegroundColor Green
        }
    }
}

# Copy application files
function Copy-AppFiles {
    param([string]$Source, [string]$Destination)
    
    Write-Host "Copying application files..." -ForegroundColor Yellow
    
    $filesToCopy = @(
        "*.exe",
        "*.dll",
        "package.json",
        "resources\*",
        "attached_assets\*",
        "electron\*",
        "dist\*"
    )
    
    foreach ($pattern in $filesToCopy) {
        $sourcePath = Join-Path $Source $pattern
        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination $Destination -Recurse -Force
            Write-Host "Copied: $pattern" -ForegroundColor Green
        }
    }
}

# Create Windows shortcuts
function New-WindowsShortcuts {
    param([string]$AppPath, [string]$AppName)
    
    if (!$CreateShortcuts) { return }
    
    Write-Host "Creating shortcuts..." -ForegroundColor Yellow
    
    $WshShell = New-Object -comObject WScript.Shell
    $exePath = Join-Path $AppPath "MadEasyBrowser.exe"
    
    # Desktop shortcut
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcut = $WshShell.CreateShortcut("$desktopPath\$AppName.lnk")
    $shortcut.TargetPath = $exePath
    $shortcut.WorkingDirectory = $AppPath
    $shortcut.IconLocation = Join-Path $AppPath "attached_assets\icon.ico"
    $shortcut.Description = "MadEasy Browser - AI-Powered Web Browser"
    $shortcut.Save()
    
    # Start Menu shortcut
    $startMenuPath = [Environment]::GetFolderPath("StartMenu")
    $appStartMenu = "$startMenuPath\Programs\MadEasy"
    if (!(Test-Path $appStartMenu)) {
        New-Item -ItemType Directory -Path $appStartMenu -Force | Out-Null
    }
    
    $startShortcut = $WshShell.CreateShortcut("$appStartMenu\$AppName.lnk")
    $startShortcut.TargetPath = $exePath
    $startShortcut.WorkingDirectory = $AppPath
    $startShortcut.IconLocation = Join-Path $AppPath "attached_assets\icon.ico"
    $startShortcut.Description = "MadEasy Browser - AI-Powered Web Browser"
    $startShortcut.Save()
    
    Write-Host "Shortcuts created successfully" -ForegroundColor Green
}

# Register file associations
function Register-FileAssociations {
    param([string]$AppPath)
    
    if (!(Test-Administrator)) {
        Write-Warning "Administrator privileges required for file associations"
        return
    }
    
    Write-Host "Registering file associations..." -ForegroundColor Yellow
    
    $exePath = Join-Path $AppPath "MadEasyBrowser.exe"
    
    # HTTP/HTTPS protocols
    $protocols = @("http", "https", "ftp")
    foreach ($protocol in $protocols) {
        $regPath = "HKLM:\SOFTWARE\Classes\$protocol\shell\open\command"
        if (!(Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }
        Set-ItemProperty -Path $regPath -Name "(default)" -Value "`"$exePath`" `"%1`""
    }
    
    # HTML files
    $htmlPath = "HKLM:\SOFTWARE\Classes\.html"
    if (!(Test-Path $htmlPath)) {
        New-Item -Path $htmlPath -Force | Out-Null
    }
    Set-ItemProperty -Path $htmlPath -Name "(default)" -Value "MadEasyBrowser.html"
    
    $htmlTypePath = "HKLM:\SOFTWARE\Classes\MadEasyBrowser.html\shell\open\command"
    if (!(Test-Path $htmlTypePath)) {
        New-Item -Path $htmlTypePath -Force | Out-Null
    }
    Set-ItemProperty -Path $htmlTypePath -Name "(default)" -Value "`"$exePath`" `"%1`""
    
    Write-Host "File associations registered" -ForegroundColor Green
}

# Set as default browser
function Set-DefaultBrowser {
    param([string]$AppPath)
    
    if (!$SetAsDefault -or !(Test-Administrator)) { 
        if (!$SetAsDefault) {
            Write-Host "Skipping default browser setup (use -SetAsDefault to enable)" -ForegroundColor Yellow
        } else {
            Write-Warning "Administrator privileges required to set as default browser"
        }
        return 
    }
    
    Write-Host "Setting as default browser..." -ForegroundColor Yellow
    
    # Register browser
    $browserPath = "HKLM:\SOFTWARE\Clients\StartMenuInternet\MadEasyBrowser"
    if (!(Test-Path $browserPath)) {
        New-Item -Path $browserPath -Force | Out-Null
    }
    
    Set-ItemProperty -Path $browserPath -Name "(default)" -Value "MadEasy Browser"
    Set-ItemProperty -Path $browserPath -Name "LocalizedString" -Value "MadEasy Browser"
    
    # Capabilities
    $capPath = "$browserPath\Capabilities"
    if (!(Test-Path $capPath)) {
        New-Item -Path $capPath -Force | Out-Null
    }
    
    Set-ItemProperty -Path $capPath -Name "ApplicationName" -Value "MadEasy Browser"
    Set-ItemProperty -Path $capPath -Name "ApplicationDescription" -Value "AI-Powered Web Browser with Advanced Automation"
    
    Write-Host "Default browser configured" -ForegroundColor Green
}

# Create uninstaller
function New-Uninstaller {
    param([string]$AppPath)
    
    Write-Host "Creating uninstaller..." -ForegroundColor Yellow
    
    $uninstallScript = @"
# MadEasy Browser Uninstaller
Write-Host "Uninstalling MadEasy Browser..." -ForegroundColor Yellow

# Remove application files
if (Test-Path "$AppPath") {
    Remove-Item -Path "$AppPath" -Recurse -Force
    Write-Host "Application files removed" -ForegroundColor Green
}

# Remove shortcuts
`$desktopShortcut = "$([Environment]::GetFolderPath("Desktop"))\MadEasy Browser.lnk"
if (Test-Path `$desktopShortcut) {
    Remove-Item -Path `$desktopShortcut -Force
}

`$startMenuPath = "$([Environment]::GetFolderPath("StartMenu"))\Programs\MadEasy"
if (Test-Path `$startMenuPath) {
    Remove-Item -Path `$startMenuPath -Recurse -Force
}

# Remove registry entries (requires admin)
if ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) {
    Remove-Item -Path "HKLM:\SOFTWARE\Clients\StartMenuInternet\MadEasyBrowser" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "HKCU:\Software\MadEasy" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "MadEasy Browser has been uninstalled" -ForegroundColor Green
pause
"@
    
    $uninstallPath = Join-Path $AppPath "uninstall.ps1"
    $uninstallScript | Out-File -FilePath $uninstallPath -Encoding UTF8
    
    # Add to Windows Programs list
    if (Test-Administrator) {
        $uninstallRegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MadEasyBrowser"
        if (!(Test-Path $uninstallRegPath)) {
            New-Item -Path $uninstallRegPath -Force | Out-Null
        }
        
        Set-ItemProperty -Path $uninstallRegPath -Name "DisplayName" -Value "MadEasy Browser"
        Set-ItemProperty -Path $uninstallRegPath -Name "DisplayVersion" -Value "3.0.0"
        Set-ItemProperty -Path $uninstallRegPath -Name "Publisher" -Value "MadEasy Technologies"
        Set-ItemProperty -Path $uninstallRegPath -Name "InstallLocation" -Value $AppPath
        Set-ItemProperty -Path $uninstallRegPath -Name "UninstallString" -Value "powershell.exe -ExecutionPolicy Bypass -File `"$uninstallPath`""
        Set-ItemProperty -Path $uninstallRegPath -Name "NoModify" -Value 1
        Set-ItemProperty -Path $uninstallRegPath -Name "NoRepair" -Value 1
    }
    
    Write-Host "Uninstaller created" -ForegroundColor Green
}

# Main installation function
function Install-MadEasyBrowser {
    Write-Host "MadEasy Browser Enhanced Installer" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    
    # Validate source files
    $currentPath = $PSScriptRoot
    $sourceExe = Join-Path $currentPath "MadEasyBrowser.exe"
    
    if (!(Test-Path $sourceExe)) {
        Write-Error "Installation files not found. Please run this script from the application directory."
        exit 1
    }
    
    # Create installation directories
    New-AppDirectories -BasePath $InstallPath
    
    # Copy application files
    Copy-AppFiles -Source $currentPath -Destination $InstallPath
    
    # Create shortcuts
    New-WindowsShortcuts -AppPath $InstallPath -AppName "MadEasy Browser"
    
    # Register file associations and set as default
    if (Test-Administrator) {
        Register-FileAssociations -AppPath $InstallPath
        Set-DefaultBrowser -AppPath $InstallPath
    } else {
        Write-Warning "Some features require administrator privileges:"
        Write-Host "- File associations" -ForegroundColor Yellow
        Write-Host "- Set as default browser" -ForegroundColor Yellow
        Write-Host "- System-wide installation" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Run as administrator for full installation" -ForegroundColor Cyan
    }
    
    # Create uninstaller
    New-Uninstaller -AppPath $InstallPath
    
    # Add to PATH (user level)
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($userPath -notlike "*$InstallPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$userPath;$InstallPath", "User")
        Write-Host "Added to user PATH" -ForegroundColor Green
    }
    
    # Create Windows Defender exclusion
    if (Test-Administrator) {
        try {
            Add-MpPreference -ExclusionPath $InstallPath -ErrorAction SilentlyContinue
            Write-Host "Added Windows Defender exclusion" -ForegroundColor Green
        } catch {
            Write-Warning "Could not add Windows Defender exclusion"
        }
    }
    
    Write-Host ""
    Write-Host "Installation completed successfully!" -ForegroundColor Green
    Write-Host "Application installed to: $InstallPath" -ForegroundColor Cyan
    
    if (!$Silent) {
        $launch = Read-Host "Launch MadEasy Browser now? (Y/n)"
        if ($launch -eq "" -or $launch -eq "Y" -or $launch -eq "y") {
            $exePath = Join-Path $InstallPath "MadEasyBrowser.exe"
            Start-Process $exePath
        }
    }
}

# Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Error "PowerShell 5.0 or higher is required"
    exit 1
}

# Run installation
Install-MadEasyBrowser
