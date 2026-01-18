#!/bin/bash
# Screenshot Generator for App Store & Google Play Listings
# Run this script after starting the app locally

# Configuration
APP_URL="http://localhost:3000"
OUTPUT_DIR="./store-screenshots"

# Create output directories
mkdir -p "$OUTPUT_DIR/ios-6.7"
mkdir -p "$OUTPUT_DIR/ios-6.5"
mkdir -p "$OUTPUT_DIR/android-phone"
mkdir -p "$OUTPUT_DIR/android-tablet"

echo "📸 Generating screenshots for store listings..."
echo "Make sure the app is running at $APP_URL"
echo ""

# Using Playwright to capture screenshots
npx playwright screenshot --device="iPhone 14 Pro Max" "$APP_URL" "$OUTPUT_DIR/ios-6.7/01-home.png"
npx playwright screenshot --device="iPhone 14 Pro Max" "$APP_URL" "$OUTPUT_DIR/ios-6.7/02-library.png" --wait-for-timeout=3000

echo ""
echo "✅ Screenshots saved to $OUTPUT_DIR"
echo ""
echo "Manual steps needed:"
echo "1. Review and edit screenshots in $OUTPUT_DIR"
echo "2. Add device frames using a tool like Previewed.app"
echo "3. Add marketing text overlays"
echo "4. Export at required resolutions:"
echo "   - iOS 6.7\": 1290x2796"
echo "   - iOS 6.5\": 1242x2688"
echo "   - Android Phone: 1080x1920"
echo "   - Android Tablet: 1920x1200"
