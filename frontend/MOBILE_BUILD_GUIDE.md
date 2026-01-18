# Çocuk Kitapları - Mobile App Build Guide

## Production Backend
**API URL:** `https://cocukkitaplari-production.up.railway.app`

## Overview
This guide explains how to build and deploy the Çocuk Kitapları app to iOS App Store and Google Play Store using Capacitor.

## Prerequisites

### For iOS Development:
- macOS computer
- Xcode 15+ installed
- Apple Developer Account ($99/year)
- CocoaPods installed (`sudo gem install cocoapods`)

### For Android Development:
- Android Studio installed
- JDK 17+
- Google Play Developer Account ($25 one-time)

---

## Step 1: Build the React App

```bash
cd /app/frontend
yarn build
```

This creates an optimized production build in the `build/` directory.

## Step 2: Add Native Platforms

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android
```

## Step 3: Sync Web Assets to Native Projects

```bash
npx cap sync
```

Run this command every time you make changes to the web app.

---

## iOS Setup

### Open in Xcode
```bash
npx cap open ios
```

### Configure Signing
1. In Xcode, select the project in the navigator
2. Select the "Çocuk Kitapları" target
3. Go to "Signing & Capabilities"
4. Select your Team (Apple Developer Account)
5. Xcode will automatically manage signing

### Configure In-App Purchases
1. Go to App Store Connect → My Apps → Çocuk Kitapları
2. Navigate to "Subscriptions"
3. Create subscription group: "Çocuk Kitapları Premium"
4. Add products:
   - `cocukkitaplari_premium_monthly` - Monthly subscription (₺29.99)
   - `cocukkitaplari_premium_yearly` - Yearly subscription (₺214.99)

### Add Capability
1. In Xcode, go to Signing & Capabilities
2. Click "+ Capability"
3. Add "In-App Purchase"

### App Icons & Launch Screen
1. Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
2. Customize `ios/App/App/Base.lproj/LaunchScreen.storyboard`

### Build for App Store
1. Select "Any iOS Device" as build target
2. Product → Archive
3. Window → Organizer → Distribute App

---

## Android Setup

### Open in Android Studio
```bash
npx cap open android
```

### Configure Signing
1. Create a keystore:
```bash
keytool -genkey -v -keystore cocukkitaplari.keystore -alias cocukkitaplari -keyalg RSA -keysize 2048 -validity 10000
```

2. Add to `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("cocukkitaplari.keystore")
            storePassword "your_password"
            keyAlias "cocukkitaplari"
            keyPassword "your_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Configure In-App Purchases
1. Go to Google Play Console → Your App
2. Navigate to "Monetize" → "Products" → "Subscriptions"
3. Create products:
   - `cocukkitaplari_premium_monthly` - Monthly subscription
   - `cocukkitaplari_premium_yearly` - Yearly subscription

### App Icons
Replace icons in `android/app/src/main/res/mipmap-*/`

### Build APK/AAB
```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (App Bundle - recommended)
```

Output location: `android/app/build/outputs/`

---

## Testing In-App Purchases

### iOS Sandbox Testing
1. Create sandbox test users in App Store Connect
2. Sign out of App Store on device
3. Make a purchase - it will prompt for sandbox login

### Android Testing
1. Add test license accounts in Google Play Console
2. Upload app to Internal Testing track
3. Install via Play Store to test purchases

---

## Deployment Checklist

### App Store (iOS)
- [ ] App icons (all sizes)
- [ ] Launch screen customized
- [ ] App Store screenshots (6.5", 5.5", iPad)
- [ ] App description in Turkish
- [ ] Privacy policy URL
- [ ] In-app purchases configured
- [ ] Age rating: 4+
- [ ] Category: Education / Kids

### Google Play (Android)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone, tablet)
- [ ] Short & full description in Turkish
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] In-app products configured
- [ ] Target audience: Children (requires Family Policy compliance)

---

## Useful Commands

```bash
# Build web app
yarn build

# Sync to native projects
npx cap sync

# Open iOS project
npx cap open ios

# Open Android project
npx cap open android

# Run on iOS simulator
npx cap run ios

# Run on Android emulator
npx cap run android

# Update Capacitor plugins
npx cap update
```

---

## Troubleshooting

### iOS Build Issues
- Clean build: Xcode → Product → Clean Build Folder
- Reset CocoaPods: `cd ios && pod deintegrate && pod install`

### Android Build Issues
- Clean build: Android Studio → Build → Clean Project
- Invalidate caches: File → Invalidate Caches / Restart

### In-App Purchase Not Working
- Ensure bundle ID matches App Store/Play Store
- Check product IDs are exactly the same
- Verify sandbox/test accounts are properly configured
- Check device is signed out of production App Store account

---

## Support

For questions about Capacitor: https://capacitorjs.com/docs
For IAP issues: https://github.com/nicklockwood/cordova-plugin-purchase
