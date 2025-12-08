# Google Sign-In Fix for Expo

## The Problem

`@react-native-google-signin/google-signin` is a native module that doesn't work with **Expo Go**. 

## Choose Your Solution

### ✅ Option 1: Create Development Build (Recommended - Keeps Current Code)
### ⚡ Option 2: Use Expo Auth Session (More Work, Works with Expo Go)  
### 🚀 Option 3: Temporarily Disable (Quick Test)

---

## Option 1: Create Development Build (RECOMMENDED)

This keeps your existing Google Sign-In code and works immediately.

## Solution: Create a Development Build

A development build is like Expo Go but customized for your app with all native modules included.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

If you don't have an account, create one at https://expo.dev

### Step 3: Configure EAS
```bash
eas build:configure
```

This creates `eas.json` in your project.

### Step 4: Build for Android
```bash
eas build --profile development --platform android
```

This will:
- Build your app with Google Sign-In included
- Give you a downloadable APK
- Install it on your device

### Step 5: Start Development Server
```bash
npx expo start --dev-client
```

Now press `a` to open on your device with the development build installed.

## Alternative: Use Expo's Auth Session (Recommended)

Instead of `@react-native-google-signin/google-signin`, use Expo's built-in authentication:

### 1. Install Expo Auth Session
```bash
npx expo install expo-auth-session expo-web-browser
```

### 2. Update Your Auth Code

Replace Google Sign-In implementation with:

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// In your component
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID',
});

// Handle sign in
const handleGoogleSignIn = async () => {
  const result = await promptAsync();
  if (result?.type === 'success') {
    const { authentication } = result;
    // Use authentication.accessToken with Supabase
  }
};
```

### 3. Configure Google OAuth

In Google Cloud Console:
- Add redirect URI: `https://auth.expo.io/@your-username/studymanager`
- Get your client IDs

### 4. Update Supabase Auth

```typescript
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: authentication.idToken,
});
```

## Option 3: Temporarily Disable Google Sign-In

To test other app features without Google Sign-In, use the mock:

### In CalendarScreen.tsx, change the import:
```typescript
// Replace this line:
import { GoogleSignin, statusCodes, isSuccessResponse } from '@react-native-google-signin/google-signin';

// With this:
import { GoogleSignin, statusCodes, isSuccessResponse } from '../../utils/googleSignInMock';
```

### In googleCalendarService.ts, change the import:
```typescript
// Replace this line:
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// With this:
import { GoogleSignin } from '../utils/googleSignInMock';
```

This will allow your app to run in Expo Go, but Google Calendar features will show an error message when clicked.

## Which Option Should You Choose?

- **Development Build**: If you want to keep using `@react-native-google-signin/google-signin`
- **Expo Auth Session**: Easier, works with Expo Go, recommended for new projects
- **Remove Temporarily**: Quick way to test other features

## Resources

- Expo Auth Session: https://docs.expo.dev/guides/authentication/
- Google Sign-In: https://docs.expo.dev/guides/google-authentication/
- Development Builds: https://docs.expo.dev/develop/development-builds/introduction/
