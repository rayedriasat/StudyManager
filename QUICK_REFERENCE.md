# Quick Reference - Google Auth Conditional Setup

## 🎯 What Was Done

Added automatic detection to disable Google Sign-In in Expo Go while keeping it enabled in builds.

## 🚀 Start Testing NOW

```bash
npm start
# Scan QR code with Expo Go
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/utils/googleSignInConfig.ts` | Smart conditional export (main logic) |
| `src/utils/googleSignInMock.ts` | Mock implementation for Expo Go |
| `src/screens/main/CalendarScreen.tsx` | Uses conditional import |
| `EXPO_GO_TESTING.md` | Complete testing guide |

## 🔍 How It Detects Environment

```typescript
// Automatically detects if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

// Returns true in Expo Go, false in builds
```

## ✅ What Works in Expo Go

- Authentication (email/password)
- Tasks (create, edit, delete, filter)
- Canvas integration
- Dashboard
- Profile
- Calendar view

## ⏸️ What's Disabled in Expo Go

- Google Calendar connection (shows helpful message)
- Google Calendar sync (shows helpful message)

## 🔧 Enable Google Calendar

```bash
# Create development build
eas build --profile development --platform android

# Install and run - Google Calendar will work!
```

## 💡 Pro Tips

1. **No code changes needed** - automatically switches based on environment
2. **Test fast** - 90% of features work in Expo Go
3. **Clear messages** - users see helpful alerts, not errors
4. **Production ready** - full functionality in release builds

## 🎨 Optional: Add Visual Indicator

```typescript
import ExpoGoBanner from '../components/ExpoGoBanner';

// Add to any screen
<ExpoGoBanner />
```

Shows: "📱 Running in Expo Go - Google Calendar disabled"

## 📚 More Info

- Fu