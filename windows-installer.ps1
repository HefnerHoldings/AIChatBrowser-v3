# AIChatBrowser Windows Installer Script
# PowerShell script for setting up AIChatBrowser on Windows

param(
    [switch]$Production,
    [switch]$SkipDependencies,
    [switch]$CreateShortcuts,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Banner {
    Write-ColorOutput @"

 ███╗   ███╗ █████╗ ██████╗ ███████╗ █████╗ ███████╗██╗   ██╗
 ████╗ ████║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝
 ██╔████╔██║███████║██║  ██║█████╗  ███████║███████╗ ╚████╔╝ 
 ██║╚██╔╝██║██╔══██║██║  ██║██╔══╝  ██╔══██║╚════██║  ╚██╔╝  
 ██║ ╚═╝ ██║██║  ██║██████╔╝███████╗██║  ██║███████║   ██║   
 ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   

           AIChatBrowser v3.0 - Windows Installer
                   AI-Powered Browser Setup

"@ -Color Header
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Dependencies {
    Write-ColorOutput "Installing dependencies..." -Color Info
    
    # Check if Node.js is already available
    if (Test-Path "node-portable\node-v22.19.0-win-x64\node.exe") {
        Write-ColorOutput "✓ Node.js portable version found" -Color Success
        return
    }
    
    # Check if we have the portable Node.js zip
    if (Test-Path "node-portable.zip") {
        Write-ColorOutput "Extracting portable Node.js..." -Color Info
        Expand-Archive -Path "node-portable.zip" -DestinationPath "node-portable" -Force
        Write-ColorOutput "✓ Node.js extracted successfully" -Color Success
    } else {
        Write-ColorOutput "Downloading Node.js..." -Color Info
        $nodeUrl = "https://nodejs.org/dist/v22.19.0/node-v22.19.0-win-x64.zip"
        Invoke-WebRequest -Uri $nodeUrl -OutFile "node-portable.zip" -UseBasicParsing
        Expand-Archive -Path "node-portable.zip" -DestinationPath "node-portable" -Force
        Write-ColorOutput "✓ Node.js downloaded and extracted" -Color Success
    }
    
    # Install npm packages
    Write-ColorOutput "Installing npm packages..." -Color Info
    $npmPath = "node-portable\node-v22.19.0-win-x64\npm.cmd"
    if (Test-Path $npmPath) {
        & $npmPath install
        Write-ColorOutput "✓ npm packages installed" -Color Success
    } else {
        throw "npm not found in portable Node.js installation"
    }
}

function Build-Application {
    if ($Production) {
        Write-ColorOutput "Building production version..." -Color Info
        $npmPath = "node-portable\node-v22.19.0-win-x64\npm.cmd"
        
        # Build frontend
        & $npmPath run build
        Write-ColorOutput "✓ Frontend built" -Color Success
        
        # Build Electron app
        $npxPath = "node-portable\node-v22.19.0-win-x64\npx.cmd"
        & $npxPath electron-builder --win --publish=never
        Write-ColorOutput "✓ Electron app built" -Color Success
    } else {
        Write-ColorOutput "Development mode - skipping production build" -Color Info
    }
}

function Create-Shortcuts {
    if ($CreateShortcuts) {
        Write-ColorOutput "Creating shortcuts..." -Color Info
        
        $WshShell = New-Object -comObject WScript.Shell
        $currentDir = Get-Location
        
        # Desktop shortcut
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = Join-Path $desktopPath "AIChatBrowser.lnk"
        $shortcut = $WshShell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = Join-Path $currentDir "start-windows.bat"
        $shortcut.WorkingDirectory = $currentDir
        $shortcut.IconLocation = Join-Path $currentDir "attached_assets\icon.ico"
        $shortcut.Description = "AI-Powered Web Browser"
        $shortcut.Save()
        
        # Start Menu shortcut
        $startMenuPath = [Environment]::GetFolderPath("Programs")
        $startMenuShortcut = Join-Path $startMenuPath "AIChatBrowser.lnk"
        $startShortcut = $WshShell.CreateShortcut($startMenuShortcut)
        $startShortcut.TargetPath = Join-Path $currentDir "start-windows.bat"
        $startShortcut.WorkingDirectory = $currentDir
        $startShortcut.IconLocation = Join-Path $currentDir "attached_assets\icon.ico"
        $startShortcut.Description = "AI-Powered Web Browser"
        $startShortcut.Save()
        
        Write-ColorOutput "✓ Shortcuts created" -Color Success
    }
}

function Set-FileAssociations {
    if (Test-Administrator) {
        Write-ColorOutput "Setting up file associations..." -Color Info
        
        # Register protocol handler
        $regPath = "HKLM:\SOFTWARE\Classes\madeasy-browser"
        New-Item -Path $regPath -Force | Out-Null
        Set-ItemProperty -Path $regPath -Name "(Default)" -Value "MadEasy Browser Protocol"
        Set-ItemProperty -Path $regPath -Name "URL Protocol" -Value ""
        
        $commandPath = "$regPath\shell\open\command"
        New-Item -Path $commandPath -Force | Out-Null
        Set-ItemProperty -Path $commandPath -Name "(Default)" -Value "`"$(Get-Location)\start-windows.bat`" `"%1`""
        
        Write-ColorOutput "✓ Protocol handler registered" -Color Success
    } else {
        Write-ColorOutput "⚠ Skipping file associations (requires administrator)" -Color Warning
    }
}

function Test-Installation {
    Write-ColorOutput "Testing installation..." -Color Info
    
    # Test Node.js
    $nodePath = "node-portable\node-v22.19.0-win-x64\node.exe"
    if (Test-Path $nodePath) {
        $nodeVersion = & $nodePath --version
        Write-ColorOutput "✓ Node.js version: $nodeVersion" -Color Success
    } else {
        throw "Node.js not found after installation"
    }
    
    # Test npm
    $npmPath = "node-portable\node-v22.19.0-win-x64\npm.cmd"
    if (Test-Path $npmPath) {
        $npmVersion = & $npmPath --version
        Write-ColorOutput "✓ npm version: $npmVersion" -Color Success
    } else {
        throw "npm not found after installation"
    }
    
    # Test package.json
    if (Test-Path "package.json") {
        Write-ColorOutput "✓ package.json found" -Color Success
    } else {
        throw "package.json not found"
    }
    
    # Test electron files
    if (Test-Path "electron\main.js") {
        Write-ColorOutput "✓ Electron main.js found" -Color Success
    } else {
        throw "Electron files not found"
    }
    
    Write-ColorOutput "✓ Installation test passed" -Color Success
}

function Show-CompletionMessage {
    Write-ColorOutput @"

🎉 Installation Complete!

AIChatBrowser has been successfully installed on your Windows system.

Next steps:
1. Double-click 'start-windows.bat' to launch the browser
2. Or use the desktop shortcut (if created)
3. The browser will open at http://localhost:5000

Features:
• AI-powered web browsing
• Multi-tab interface  
• Download management
• Bookmark and history sync
• Developer tools
• Extension support

For support and documentation:
• Check the README files in this directory
• Visit our GitHub repository
• Join our Discord community

Happy browsing! 🚀

"@ -Color Success
}

# Main installation process
try {
    Show-Banner
    
    Write-ColorOutput "Starting AIChatBrowser installation..." -Color Info
    Write-ColorOutput "Installation directory: $(Get-Location)" -Color Info
    
    if (!$SkipDependencies) {
        Install-Dependencies
    }
    
    if ($Production) {
        Build-Application
    }
    
    if ($CreateShortcuts) {
        Create-Shortcuts
    }
    
    Set-FileAssociations
    Test-Installation
    Show-CompletionMessage
    
    Write-ColorOutput "Installation completed successfully!" -Color Success
    
} catch {
    Write-ColorOutput "Installation failed: $($_.Exception.Message)" -Color Error
    Write-ColorOutput "Please check the error above and try again." -Color Error
    exit 1
}
