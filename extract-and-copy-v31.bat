@echo off
:: Extract and copy v31 files for integration analysis
echo ==========================================
echo AIChatBrowser v3.01 File Preparation
echo ==========================================
echo.

cd /d "C:\Users\User\AIChatBrowser-v3"

echo 📁 Current directory: %CD%
echo.

:: Check if v31 folder exists
if exist "v31" (
    echo ✅ Found v31 folder
    
    :: Copy v31 folder to v31-source
    echo 📋 Copying v31 folder to v31-source...
    if exist "v31-source" (
        echo   Removing existing v31-source...
        rd /s /q "v31-source"
    )
    
    xcopy "v31" "v31-source" /E /I /Y
    
    if %errorlevel% == 0 (
        echo ✅ v31 folder copied successfully to v31-source
    ) else (
        echo ❌ Error copying v31 folder
    )
    echo.
) else (
    echo ❌ v31 folder not found
)

:: Check if ZIP file exists
if exist "AIChatBrowser (1).zip" (
    echo ✅ Found AIChatBrowser (1).zip
    
    :: Extract ZIP file to temporary folder
    echo 📦 Extracting ZIP file...
    if exist "temp-extract" (
        rd /s /q "temp-extract"
    )
    mkdir "temp-extract"
    
    :: Use PowerShell to extract ZIP
    powershell -Command "Expand-Archive -Path 'AIChatBrowser (1).zip' -DestinationPath 'temp-extract' -Force"
    
    if %errorlevel% == 0 (
        echo ✅ ZIP file extracted to temp-extract
        
        :: Copy extracted files to v31-zip-source
        echo 📋 Copying extracted files to v31-zip-source...
        if exist "v31-zip-source" (
            rd /s /q "v31-zip-source"
        )
        
        :: Find the main folder in extracted content
        for /d %%i in ("temp-extract\*") do (
            echo   Found extracted folder: %%i
            xcopy "%%i" "v31-zip-source" /E /I /Y
            goto :zip_copied
        )
        
        :: If no subfolder found, copy all content
        xcopy "temp-extract\*" "v31-zip-source" /E /I /Y
        
        :zip_copied
        echo ✅ ZIP content copied to v31-zip-source
        
        :: Cleanup temp folder
        rd /s /q "temp-extract"
        echo 🧹 Cleaned up temporary files
    ) else (
        echo ❌ Error extracting ZIP file
    )
    echo.
) else (
    echo ❌ AIChatBrowser (1).zip not found
)

:: Summary
echo ==========================================
echo 📊 SUMMARY
echo ==========================================

if exist "v31-source" (
    echo ✅ v31-source folder created from v31 folder
    echo    Contents:
    dir "v31-source" /b | findstr /v "^$"
    echo.
)

if exist "v31-zip-source" (
    echo ✅ v31-zip-source folder created from ZIP file
    echo    Contents:
    dir "v31-zip-source" /b | findstr /v "^$"
    echo.
)

echo 🎉 Files are now ready for analysis!
echo.
echo 📋 Next steps:
echo   1. Run integration analysis
echo   2. Compare versions
echo   3. Start integration process
echo.

pause