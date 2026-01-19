# Android Keystore Setup Guide

## ⚠️ CRITICAL: Read Before Proceeding

Your Android keystore is the **ONLY way to sign app updates**. If you lose it, you can NEVER update your app on Google Play Store - you'd have to create a new app listing.

## Step 1: Generate Your Production Keystore (ONE TIME ONLY)

Run this command on your local machine to create a permanent keystore:

```bash
keytool -genkey -v \
  -keystore cocukkitaplari-release.keystore \
  -alias cocukkitaplari \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- **Keystore password**: Choose a strong password (save it securely!)
- **Key password**: Can be the same as keystore password
- **Your name, organization, etc.**: Fill in your details

## Step 2: Backup Your Keystore

**IMMEDIATELY** back up your keystore file:
1. Copy `cocukkitaplari-release.keystore` to a secure cloud storage (Google Drive, iCloud, etc.)
2. Save your passwords in a password manager (1Password, Bitwarden, etc.)
3. Keep a copy on a USB drive in a safe place

**DO NOT**:
- Commit the keystore to git
- Share it publicly
- Lose it!

## Step 3: Get SHA-1 Fingerprint (For Google OAuth)

Run this command to get your SHA-1 certificate fingerprint:

```bash
keytool -list -v \
  -keystore cocukkitaplari-release.keystore \
  -alias cocukkitaplari
```

Look for the line that says:
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

Use this SHA-1 fingerprint in Google Cloud Console when creating your Android OAuth client.

## Step 4: Upload Keystore to Codemagic

1. Go to [Codemagic](https://codemagic.io/apps)
2. Navigate to: **Teams** > **Your Team** > **Code signing identities** > **Android keystores**
3. Click **Add keystore**
4. Fill in:
   - **Keystore file**: Upload your `cocukkitaplari-release.keystore`
   - **Keystore password**: Your keystore password
   - **Key alias**: `cocukkitaplari`
   - **Key password**: Your key password
   - **Reference name**: `cocukkitaplari_keystore` (must match codemagic.yaml!)

## Step 5: Verify Setup

After uploading, Codemagic will automatically:
- Sign your APK/AAB with your keystore
- Use environment variables for passwords (secure)
- Not expose your keystore in build logs

## Troubleshooting

### "No keystore found" error
- Make sure the reference name in Codemagic matches `cocukkitaplari_keystore`
- Check that the keystore was uploaded successfully

### "Invalid keystore format" error
- Ensure you're uploading a `.keystore` or `.jks` file
- Try regenerating the keystore if the file is corrupted

### "Wrong password" error
- Double-check both keystore password and key password
- They can be different if you set them differently during generation

## SHA-1 Fingerprints for Google OAuth

You'll need SHA-1 fingerprints for both debug and release keystores:

### Release SHA-1 (from your keystore)
```bash
keytool -list -v -keystore cocukkitaplari-release.keystore -alias cocukkitaplari
```

### Debug SHA-1 (for local testing)
```bash
# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Add BOTH SHA-1 fingerprints to your Google Cloud Console Android OAuth client.
