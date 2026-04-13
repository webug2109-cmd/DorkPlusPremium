# DorkPlusPremium - Build Instructions

## Desktop Version (Windows/Mac/Linux Executable)

### Prerequisites
- Node.js 16+
- Python 3.11+
- PyInstaller

### Backend Executable Build

```bash
# Install PyInstaller
pip install pyinstaller

# Navigate to backend
cd /app/backend

# Create standalone executable
pyinstaller --onefile \
  --name DorkPlusPremium-Server \
  --add-data "modules:modules" \
  --hidden-import=motor \
  --hidden-import=aiohttp \
  --hidden-import=beautifulsoup4 \
  server.py

# Executable will be in dist/DorkPlusPremium-Server.exe (Windows)
# or dist/DorkPlusPremium-Server (Linux/Mac)
```

### Frontend Desktop App (Electron)

```bash
# Install Electron builder
cd /app/frontend
yarn add --dev electron electron-builder electron-is-dev

# Build React app
yarn build

# Package with Electron
npx electron-builder --windows --linux --mac

# Installers will be in dist/
# - DorkPlusPremium-Setup-2.0.0.exe (Windows)
# - DorkPlusPremium-2.0.0.AppImage (Linux)
# - DorkPlusPremium-2.0.0.dmg (Mac)
```

### Complete Desktop Package

1. Build backend executable
2. Build frontend with Electron
3. Package both together
4. User runs:
   - DorkPlusPremium-Server.exe (starts backend on port 8001)
   - DorkPlusPremium.exe (opens Electron app)

---

## Mobile Version (Android APK)

### Prerequisites
- Node.js 16+
- Android Studio
- Capacitor CLI

### Build Android APK

```bash
# Install Capacitor
cd /app/frontend
yarn add @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init DorkPlusPremium com.frostbyt3s.dorkplus --web-dir=build

# Build React app
yarn build

# Add Android platform
npx cap add android

# Copy web assets
npx cap copy android

# Open in Android Studio
npx cap open android

# Build APK in Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)

# APK will be in:
# android/app/build/outputs/apk/release/app-release.apk
```

### Sign APK for Release

```bash
# Generate keystore
keytool -genkey -v -keystore dorkplus-release.keystore \
  -alias dorkplus -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore dorkplus-release.keystore \
  app-release-unsigned.apk dorkplus

# Optimize APK
zipalign -v 4 app-release-unsigned.apk DorkPlusPremium-2.0.0.apk
```

---

## iOS Version (iPhone/iPad)

```bash
# Add iOS platform
cd /app/frontend
npx cap add ios

# Copy web assets  
npx cap copy ios

# Open in Xcode
npx cap open ios

# Build in Xcode:
# Product > Archive > Distribute App
```

---

## Auto-Build Script (All Platforms)

```bash
#!/bin/bash
# build-all.sh

echo "Building DorkPlusPremium for all platforms..."

# Backend
echo "Building backend executable..."
cd backend
pyinstaller --onefile --name DorkPlusPremium-Server server.py

# Frontend Web
echo "Building web version..."
cd ../frontend
yarn build

# Desktop (Electron)
echo "Building desktop apps..."
npx electron-builder --windows --linux --mac

# Mobile (Android)
echo "Building Android APK..."
npx cap copy android
cd android
./gradlew assembleRelease

echo "Build complete!"
echo "Outputs:"
echo "  - backend/dist/DorkPlusPremium-Server"
echo "  - frontend/dist/*.exe, *.AppImage, *.dmg"
echo "  - frontend/android/app/build/outputs/apk/release/*.apk"
```

---

## Distribution Package Structure

```
DorkPlusPremium-v2.0.0/
├── Windows/
│   ├── DorkPlusPremium-Server.exe
│   ├── DorkPlusPremium-Setup.exe
│   └── README.txt
├── Linux/
│   ├── DorkPlusPremium-Server
│   ├── DorkPlusPremium.AppImage
│   └── README.txt
├── Mac/
│   ├── DorkPlusPremium-Server
│   ├── DorkPlusPremium.dmg
│   └── README.txt
├── Android/
│   ├── DorkPlusPremium-2.0.0.apk
│   └── README.txt
└── LICENSE.txt
```

---

## Notes

- Desktop versions require backend server running locally
- Mobile version connects to remote backend URL
- Configure backend URL in settings
- For mobile, backend should be accessible via public IP/domain

---

**Created by Frostbyt3s**
**DorkPlusPremium v2.0.0**
