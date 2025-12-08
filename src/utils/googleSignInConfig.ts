import Constants from 'expo-constants';

// Check if running in Expo Go (not a development build or release build)
// In Expo Go: Constants.appOwnership === 'expo'
// In development/release builds: Constants.appOwnership === null or 'standalone'
export const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally export GoogleSignin based on environment
// This allows testing all other features in Expo Go while keeping Google Sign-In for builds
export const GoogleSignin = isExpoGo
  ? require('./googleSignInMock').GoogleSignin
  : require('@react-native-google-signin/google-signin').GoogleSignin;

export const statusCodes = isExpoGo
  ? require('./googleSignInMock').statusCodes
  : require('@react-native-google-signin/google-signin').statusCodes;

export const isSuccessResponse = isExpoGo
  ? require('./googleSignInMock').isSuccessResponse
  : require('@react-native-google-signin/google-signin').isSuccessResponse;
