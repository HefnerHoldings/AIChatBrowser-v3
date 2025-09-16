@echo off
REM MadEasy Browser - Android Build Script for Windows
REM Builds the Android WebView app using Gradle

echo ========================================
echo   MADEASY BROWSER - ANDROID BUILD
echo ========================================
echo.

setlocal EnableDelayedExpansion

REM Configuration
set PROJECT_NAME=MadEasyBrowser
set PACKAGE_NAME=com.madeasy.aichatbrowser
set BUILD_TYPE=release

echo 🤖 Building MadEasy Browser for Android...
echo.

REM Check if Android SDK is available
echo 🔍 Checking Android SDK...
if "%ANDROID_HOME%"=="" (
    echo ❌ ANDROID_HOME not set. Please install Android SDK.
    echo 📥 Download from: https://developer.android.com/studio
    pause
    exit /b 1
)

if not exist "%ANDROID_HOME%" (
    echo ❌ ANDROID_HOME directory not found: %ANDROID_HOME%
    pause
    exit /b 1
)

echo ✅ Android SDK found: %ANDROID_HOME%

REM Check if Java is available
echo.
echo 🔍 Checking Java...
java -version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Java not found. Please install JDK 11 or higher.
    pause
    exit /b 1
)

for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VERSION=%%g
    set JAVA_VERSION=!JAVA_VERSION:"=!
)
echo ✅ Java found: !JAVA_VERSION!

REM Setup Android project structure
echo.
echo 📦 Setting up Android project structure...

mkdir app\src\main\java\com\madeasy\aichatbrowser 2>nul
mkdir app\src\main\res\layout 2>nul
mkdir app\src\main\res\values 2>nul
mkdir app\src\main\res\mipmap-hdpi 2>nul
mkdir app\src\main\res\mipmap-mdpi 2>nul
mkdir app\src\main\res\mipmap-xhdpi 2>nul
mkdir app\src\main\res\mipmap-xxhdpi 2>nul
mkdir app\src\main\res\mipmap-xxxhdpi 2>nul

REM Copy source files
if exist "MainActivity.java" (
    copy "MainActivity.java" "app\src\main\java\com\madeasy\aichatbrowser\" >nul
    echo ✅ MainActivity.java copied
)

if exist "AndroidManifest.xml" (
    copy "AndroidManifest.xml" "app\src\main\" >nul
    echo ✅ AndroidManifest.xml copied
)

if exist "activity_main.xml" (
    copy "activity_main.xml" "app\src\main\res\layout\" >nul
    echo ✅ activity_main.xml copied
)

if exist "strings.xml" (
    copy "strings.xml" "app\src\main\res\values\" >nul
    echo ✅ strings.xml copied
)

if exist "styles.xml" (
    copy "styles.xml" "app\src\main\res\values\" >nul
    echo ✅ styles.xml copied
)

REM Create Gradle build files
echo.
echo 📦 Creating Gradle build files...

REM Root build.gradle
(
echo buildscript {
echo     repositories {
echo         google()
echo         mavenCentral()
echo     }
echo     dependencies {
echo         classpath 'com.android.tools.build:gradle:8.1.0'
echo     }
echo }
echo.
echo allprojects {
echo     repositories {
echo         google()
echo         mavenCentral()
echo     }
echo }
echo.
echo task clean(type: Delete^) {
echo     delete rootProject.buildDir
echo }
) > build.gradle

REM App build.gradle
(
echo apply plugin: 'com.android.application'
echo.
echo android {
echo     compileSdk 34
echo.
echo     defaultConfig {
echo         applicationId "com.madeasy.aichatbrowser"
echo         minSdk 21
echo         targetSdk 34
echo         versionCode 1
echo         versionName "3.0.0"
echo     }
echo.
echo     buildTypes {
echo         release {
echo             minifyEnabled false
echo             proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'^), 'proguard-rules.pro'
echo         }
echo     }
echo.
echo     compileOptions {
echo         sourceCompatibility JavaVersion.VERSION_1_8
echo         targetCompatibility JavaVersion.VERSION_1_8
echo     }
echo }
echo.
echo dependencies {
echo     implementation 'androidx.appcompat:appcompat:1.6.1'
echo     implementation 'androidx.core:core:1.10.1'
echo }
) > app\build.gradle

REM gradle.properties
(
echo org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
echo android.useAndroidX=true
echo android.enableJetifier=true
) > gradle.properties

REM settings.gradle
(
echo include ':app'
echo rootProject.name = "MadEasyBrowser"
) > settings.gradle

echo ✅ Gradle files created

REM Create Gradle wrapper if not exists
if not exist "gradlew.bat" (
    echo 📦 Creating Gradle wrapper...
    gradle wrapper --gradle-version 8.0
)

REM Build the Android app
echo.
echo 🏗️ Building Android app...

REM Clean previous builds
call gradlew.bat clean

REM Build debug APK
echo.
echo 📦 Building debug APK...
call gradlew.bat assembleDebug

if !errorlevel! equ 0 (
    echo ✅ Debug APK built successfully
) else (
    echo ❌ Debug build failed
    pause
    exit /b 1
)

REM Build release APK (unsigned)
echo.
echo 📦 Building release APK...
call gradlew.bat assembleRelease

if !errorlevel! equ 0 (
    echo ✅ Release APK built successfully
) else (
    echo ⚠️ Release build failed (this is normal without signing key)
)

REM Display build results
echo.
echo 📊 Build Results
echo ================
echo.

if exist "app\build\outputs\apk" (
    echo 📁 APK files:
    for /r "app\build\outputs\apk" %%f in (*.apk) do (
        echo    %%f
    )
    echo.
)

echo 🎯 Next steps:
echo 1. Install debug APK: adb install app\build\outputs\apk\debug\app-debug.apk
echo 2. Test on device or emulator
echo 3. Sign release APK for distribution
echo 4. Upload to Google Play Store
echo.

echo ✅ Android build completed!
echo.
pause
