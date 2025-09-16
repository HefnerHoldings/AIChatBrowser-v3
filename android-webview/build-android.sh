#!/bin/bash

# MadEasy Browser - Android Build Script
# Builds the Android WebView app using Gradle

echo "🤖 Building MadEasy Browser for Android..."
echo "=========================================="

# Configuration
PROJECT_NAME="MadEasyBrowser"
PACKAGE_NAME="com.madeasy.aichatbrowser"
BUILD_TYPE="release"
OUTPUT_DIR="./build/outputs/apk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Android SDK is available
check_android_sdk() {
    print_step "Checking Android SDK..."
    
    if [ -z "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME not set. Please install Android SDK."
        print_warning "Download from: https://developer.android.com/studio"
        exit 1
    fi
    
    if [ ! -d "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME directory not found: $ANDROID_HOME"
        exit 1
    fi
    
    print_success "Android SDK found: $ANDROID_HOME"
}

# Check if Java is available
check_java() {
    print_step "Checking Java..."
    
    if ! command -v java &> /dev/null; then
        print_error "Java not found. Please install JDK 11 or higher."
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2)
    print_success "Java found: $JAVA_VERSION"
}

# Setup Android project structure
setup_project() {
    print_step "Setting up Android project structure..."
    
    # Create directories
    mkdir -p app/src/main/java/com/madeasy/aichatbrowser
    mkdir -p app/src/main/res/layout
    mkdir -p app/src/main/res/values
    mkdir -p app/src/main/res/mipmap-hdpi
    mkdir -p app/src/main/res/mipmap-mdpi
    mkdir -p app/src/main/res/mipmap-xhdpi
    mkdir -p app/src/main/res/mipmap-xxhdpi
    mkdir -p app/src/main/res/mipmap-xxxhdpi
    
    # Copy source files
    if [ -f "MainActivity.java" ]; then
        cp MainActivity.java app/src/main/java/com/madeasy/aichatbrowser/
        print_success "MainActivity.java copied"
    fi
    
    if [ -f "AndroidManifest.xml" ]; then
        cp AndroidManifest.xml app/src/main/
        print_success "AndroidManifest.xml copied"
    fi
    
    if [ -f "activity_main.xml" ]; then
        cp activity_main.xml app/src/main/res/layout/
        print_success "activity_main.xml copied"
    fi
    
    if [ -f "strings.xml" ]; then
        cp strings.xml app/src/main/res/values/
        print_success "strings.xml copied"
    fi
    
    if [ -f "styles.xml" ]; then
        cp styles.xml app/src/main/res/values/
        print_success "styles.xml copied"
    fi
}

# Create Gradle build files
create_gradle_files() {
    print_step "Creating Gradle build files..."
    
    # Root build.gradle
    cat > build.gradle << 'EOF'
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
EOF

    # App build.gradle
    cat > app/build.gradle << 'EOF'
apply plugin: 'com.android.application'

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.madeasy.aichatbrowser"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "3.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core:1.10.1'
}
EOF

    # gradle.properties
    cat > gradle.properties << 'EOF'
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
EOF

    # settings.gradle
    cat > settings.gradle << 'EOF'
include ':app'
rootProject.name = "MadEasyBrowser"
EOF

    # Gradle wrapper
    if [ ! -f "gradlew" ]; then
        print_step "Creating Gradle wrapper..."
        gradle wrapper --gradle-version 8.0
    fi
    
    print_success "Gradle files created"
}

# Build the Android app
build_app() {
    print_step "Building Android app..."
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Clean previous builds
    ./gradlew clean
    
    # Build debug APK
    print_step "Building debug APK..."
    ./gradlew assembleDebug
    
    if [ $? -eq 0 ]; then
        print_success "Debug APK built successfully"
    else
        print_error "Debug build failed"
        exit 1
    fi
    
    # Build release APK (unsigned)
    print_step "Building release APK..."
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        print_success "Release APK built successfully"
    else
        print_warning "Release build failed (this is normal without signing key)"
    fi
}

# Display build results
display_results() {
    print_step "Build Results"
    echo ""
    
    if [ -d "app/build/outputs/apk" ]; then
        echo "📁 APK files:"
        find app/build/outputs/apk -name "*.apk" -exec ls -lh {} \; | while read line; do
            echo "   $line"
        done
        echo ""
    fi
    
    echo "🎯 Next steps:"
    echo "1. Install debug APK: adb install app/build/outputs/apk/debug/app-debug.apk"
    echo "2. Test on device or emulator"
    echo "3. Sign release APK for distribution"
    echo "4. Upload to Google Play Store"
    echo ""
    
    print_success "Android build completed!"
}

# Main build process
main() {
    check_java
    check_android_sdk
    setup_project
    create_gradle_files
    build_app
    display_results
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
