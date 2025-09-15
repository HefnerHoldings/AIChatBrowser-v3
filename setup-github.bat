@echo off
:: GitHub Repository Setup for MadEasy Browser
echo.
echo =============================================
echo MadEasy Browser - GitHub Repository Setup
echo =============================================
echo.

echo This script will help you set up GitHub repository and push your code.
echo.
echo Before running this script, make sure you have:
echo 1. Created a new repository on GitHub (e.g., "MadEasy-Browser")
echo 2. Have Git installed and configured
echo 3. Have GitHub credentials ready
echo.

set /p REPO_URL="Enter your GitHub repository URL (https://github.com/username/repo-name.git): "

if "%REPO_URL%"=="" (
    echo ERROR: Repository URL is required
    pause
    exit /b 1
)

echo.
echo Setting up remote repository...
git remote add origin %REPO_URL%

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

if %errorlevel% == 0 (
    echo.
    echo ✅ Successfully pushed to GitHub!
    echo.
    echo Your repository is now available at:
    echo %REPO_URL%
    echo.
) else (
    echo.
    echo ❌ Failed to push to GitHub
    echo Please check your credentials and repository URL
    echo.
)

echo.
echo Creating release tag...
git tag -a v3.0.0 -m "MadEasy Browser v3.0.0 - Complete Windows Optimization & Professional Distribution"

echo Pushing tags...
git push origin v3.0.0

if %errorlevel% == 0 (
    echo.
    echo ✅ Release tag v3.0.0 created successfully!
    echo.
    echo You can now create a GitHub Release at:
    echo %REPO_URL://.git=/}/releases/new?tag=v3.0.0
    echo.
) else (
    echo.
    echo ⚠ Tag creation may have failed - you can create it manually later
    echo.
)

echo.
echo 🎉 GitHub setup completed!
echo.
echo Next steps:
echo 1. Go to your GitHub repository
echo 2. Create a new Release from the v3.0.0 tag
echo 3. Upload the installer package from dist-installer folder
echo 4. Add release notes from CHANGELOG.md
echo.

set /p OPEN="Open GitHub repository in browser? (Y/n): "
if /i "%OPEN%"=="Y" (
    start %REPO_URL://.git=/%
) else if "%OPEN%"=="" (
    start %REPO_URL://.git=/%
)

pause
