#!/bin/bash

# MadEasy Browser - iOS Build Script
# Builds the iOS app using Xcode command line tools

echo "🍎 Building MadEasy Browser for iOS..."
echo "======================================"

# Configuration
PROJECT_NAME="MadEasyBrowser"
SCHEME_NAME="MadEasyBrowser"
CONFIGURATION="Release"
DERIVED_DATA_PATH="./build/DerivedData"
ARCHIVE_PATH="./build/Archive/${PROJECT_NAME}.xcarchive"
EXPORT_PATH="./build/Export"

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

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script must be run on macOS with Xcode installed"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode command line tools not found. Please install Xcode."
    exit 1
fi

# Check if project exists
if [ ! -f "${PROJECT_NAME}.xcodeproj/project.pbxproj" ] && [ ! -f "${PROJECT_NAME}.xcworkspace/contents.xcworkspacedata" ]; then
    print_error "Xcode project not found. Please create the iOS project first."
    print_warning "Follow the instructions in README.md to set up the Xcode project."
    exit 1
fi

# Create build directories
print_step "Creating build directories..."
mkdir -p build/DerivedData
mkdir -p build/Archive
mkdir -p build/Export

# Determine project file
PROJECT_FILE=""
if [ -f "${PROJECT_NAME}.xcworkspace/contents.xcworkspacedata" ]; then
    PROJECT_FILE="${PROJECT_NAME}.xcworkspace"
    PROJECT_FLAG="-workspace"
    print_success "Found workspace: ${PROJECT_FILE}"
elif [ -f "${PROJECT_NAME}.xcodeproj/project.pbxproj" ]; then
    PROJECT_FILE="${PROJECT_NAME}.xcodeproj"
    PROJECT_FLAG="-project"
    print_success "Found project: ${PROJECT_FILE}"
fi

# Clean build
print_step "Cleaning previous builds..."
xcodebuild clean \
    ${PROJECT_FLAG} "${PROJECT_FILE}" \
    -scheme "${SCHEME_NAME}" \
    -configuration "${CONFIGURATION}" \
    -derivedDataPath "${DERIVED_DATA_PATH}"

if [ $? -eq 0 ]; then
    print_success "Clean completed"
else
    print_error "Clean failed"
    exit 1
fi

# Build for simulator (for testing)
print_step "Building for iOS Simulator..."
xcodebuild build \
    ${PROJECT_FLAG} "${PROJECT_FILE}" \
    -scheme "${SCHEME_NAME}" \
    -configuration "${CONFIGURATION}" \
    -sdk iphonesimulator \
    -derivedDataPath "${DERIVED_DATA_PATH}" \
    ONLY_ACTIVE_ARCH=NO

if [ $? -eq 0 ]; then
    print_success "Simulator build completed"
else
    print_warning "Simulator build failed, continuing with device build..."
fi

# Archive for device
print_step "Creating archive for iOS device..."
xcodebuild archive \
    ${PROJECT_FLAG} "${PROJECT_FILE}" \
    -scheme "${SCHEME_NAME}" \
    -configuration "${CONFIGURATION}" \
    -sdk iphoneos \
    -archivePath "${ARCHIVE_PATH}" \
    -derivedDataPath "${DERIVED_DATA_PATH}" \
    ONLY_ACTIVE_ARCH=NO

if [ $? -eq 0 ]; then
    print_success "Archive created successfully"
else
    print_error "Archive creation failed"
    exit 1
fi

# Export IPA (requires proper provisioning profile)
print_step "Exporting IPA..."

# Create export options plist
cat > build/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
    -archivePath "${ARCHIVE_PATH}" \
    -exportPath "${EXPORT_PATH}" \
    -exportOptionsPlist build/ExportOptions.plist

if [ $? -eq 0 ]; then
    print_success "IPA export completed"
else
    print_warning "IPA export failed (this is normal without proper provisioning profile)"
fi

# Display build results
echo ""
echo "🎉 iOS Build Summary"
echo "==================="
echo "Project: ${PROJECT_FILE}"
echo "Scheme: ${SCHEME_NAME}"
echo "Configuration: ${CONFIGURATION}"
echo ""

if [ -f "${ARCHIVE_PATH}/Info.plist" ]; then
    print_success "Archive: ${ARCHIVE_PATH}"
fi

if [ -d "${EXPORT_PATH}" ]; then
    IPA_FILES=$(find "${EXPORT_PATH}" -name "*.ipa" | wc -l)
    if [ $IPA_FILES -gt 0 ]; then
        print_success "IPA files: ${EXPORT_PATH}"
        find "${EXPORT_PATH}" -name "*.ipa" -exec basename {} \; | sed 's/^/  • /'
    fi
fi

# Show next steps
echo ""
echo "🎯 Next Steps:"
echo "1. Test the app in iOS Simulator"
echo "2. Install on physical device for testing"
echo "3. Upload to TestFlight for beta testing"
echo "4. Submit to App Store for review"
echo ""
echo "📱 Testing:"
echo "• Simulator: Open Xcode and run the project"
echo "• Device: Use Xcode to install on connected device"
echo "• TestFlight: Upload archive to App Store Connect"
echo ""

print_success "iOS build process completed!"
