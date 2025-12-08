# Testing with Expo Go

This app now supports testing with Expo Go while keeping Google Sign-In functionality for release builds.

## How It Works

The app automatically detects whether it's running in Expo Go or a development/release build:

- **Expo Go**: Google Sign-In is disabled (uses mock implementation)
- **Development Build**: Google Sign-In works normally
- **Release Build**: Google Sign-In works normally

## Testing in Expo Go

1. Start the development server:
   ```bash
   npm start
   ```

2. Scan the QR code with Expo Go app

3. All features work EXCEPT Google Calendar integration:
   - ✅ Authentication (email/password)
   - ✅ Tasks management
   - ✅ Canvas integration
   - ✅ Dashboard
   - ✅ Profile
   - ❌ Google Calendar (shows helpful error message)

## Testing Google Calendar

To test Google Calendar integration, you need to create a development build:

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Create a development build
eas build --profile development --platform android
```

Or create a release build:

```bash
eas build --profile production --platform android
```

## Technical Details

The conditional logic is in `src/utils/googleSignInConfig.ts`:

```typescript
import Constants from 'expo-constants';

// Check if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

// Use mock in Expo Go, real implementation otherwise
export const GoogleSignin = isExpoGo
  ? require('./googleSignInMock').GoogleSignin
  : require('@react-native-google-signin/google-signin').GoogleSignin;
```

This approach:
- ✅ Keeps your existing code intact
- ✅ No need to comment/uncomment code
- ✅ Automatically switches based on environment
- ✅ Works for both development and release builds
- ✅ Provides clear error messages in Expo Go

## Files Modified

- `src/utils/googleSignInConfig.ts` - New conditional export
- `src/utils/googleSignInMock.ts` - Updated with better logging
- `src/screens/main/CalendarScreen.tsx` - Uses conditional import
- `src/services/googleCalendarService.ts` - Uses conditional import
