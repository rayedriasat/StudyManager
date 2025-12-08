# Expo Migration Guide

Your React Native app has been converted to use Expo! 🎉

## What Changed

### 1. Dependencies Updated
- Added Expo SDK 52
- Updated React Native to 0.76.5 (compatible with Expo)
- Updated React to 18.3.1
- Replaced React Native CLI with Expo CLI
- Updated navigation and other libraries to Expo-compatible versions

### 2. Configuration Files
- **app.json**: Now contains full Expo configuration
- **babel.config.js**: Uses `babel-preset-expo`
- **metro.config.js**: Uses Expo's Metro config
- **tsconfig.json**: Extends `expo/tsconfig.base`
- **index.js**: Uses `registerRootComponent` from Expo

### 3. Scripts Updated
- `npm start` → Starts Expo dev server
- `npm run android` → Runs on Android via Expo
- `npm run ios` → Runs on iOS via Expo
- `npm run web` → NEW! Run on web browser

## Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

This will open Expo Dev Tools. You can:
- Press `a` to open on Android
- Press `i` to open on iOS
- Press `w` to open in web browser
- Scan QR code with Expo Go app on your phone

### 3. Replace Placeholder Assets
The following placeholder files were created in `/assets`:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon

Replace these with your actual app assets.

### 4. Google Sign-In Configuration
Since you're using `@react-native-google-signin/google-signin`, you may need to:
- Configure it for Expo: https://docs.expo.dev/guides/google-authentication/
- Or consider using `expo-auth-session` for OAuth flows

### 5. Test Your App
Run through your app's features to ensure everything works:
- Authentication (Google Sign-In)
- Navigation
- AsyncStorage
- Supabase integration
- Calendar features
- Date picker
- WebView

## Benefits of Expo

✅ **Faster Development**: Hot reload and instant updates
✅ **Easy Testing**: Test on physical devices with Expo Go
✅ **Web Support**: Run your app in a browser
✅ **OTA Updates**: Push updates without app store review
✅ **Better DX**: Simplified build process and configuration

## Troubleshooting

### If you get module resolution errors:
```bash
npm install
npx expo start --clear
```

### If native modules don't work:
Some native modules may need Expo config plugins. Check:
https://docs.expo.dev/config-plugins/introduction/

### To create a production build:
```bash
npx expo prebuild
npx expo run:android --variant release
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --platform android
```

## Documentation
- Expo Docs: https://docs.expo.dev
- Expo SDK Reference: https://docs.expo.dev/versions/latest/
- Migration Guide: https://docs.expo.dev/bare/installing-expo-modules/
