# Quick Start Guide

## Current Status

✅ Your app has been converted to Expo!  
⚠️ Google Sign-In needs additional setup

## To Run Your App Now

### 1. Install Dependencies (if not done)
```bash
npm install
```

### 2. Start Expo
```bash
npm start
```

### 3. Run on Android
- Press `a` in the terminal, OR
- Scan the QR code with Expo Go app on your phone

## Google Sign-In Issue

Your app uses `@react-native-google-signin/google-signin` which doesn't work with Expo Go.

### Choose ONE solution:

#### A. Create Development Build (Recommended)
Keeps your current code, takes 10-15 minutes:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```
See `GOOGLE_SIGNIN_FIX.md` for details.

#### B. Use Mock (Quick Test)
Test other features without Google Calendar:

In `src/screens/main/CalendarScreen.tsx`:
```typescript
// Change line 14 from:
import { GoogleSignin, statusCodes, isSuccessResponse } from '@react-native-google-signin/google-signin';
// To:
import { GoogleSignin, statusCodes, isSuccessResponse } from '../../utils/googleSignInMock';
```

In `src/services/googleCalendarService.ts`:
```typescript
// Change line 1 from:
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// To:
import { GoogleSignin } from '../utils/googleSignInMock';
```

## What Works Now

✅ Faster compilation with Expo  
✅ Hot reload  
✅ Easy device testing with Expo Go  
✅ All features except Google Calendar (until you choose a solution above)

## Files Created

- `EXPO_MIGRATION.md` - Full migration details
- `GOOGLE_SIGNIN_FIX.md` - Detailed Google Sign-In solutions
- `src/utils/googleSignInMock.ts` - Mock for testing without Google Sign-In

## Need Help?

Check the detailed guides:
- Full migration info: `EXPO_MIGRATION.md`
- Google Sign-In solutions: `GOOGLE_SIGNIN_FIX.md`
- Expo docs: https://docs.expo.dev
