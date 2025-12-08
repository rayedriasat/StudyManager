// Temporary mock for Google Sign-In to allow testing with Expo Go
// This is automatically used when running in Expo Go
// For release builds, the real Google Sign-In will be used

export const GoogleSignin = {
  configure: () => {
    console.log('[Expo Go] Google Sign-In is disabled in Expo Go. Use a development build for full functionality.');
  },
  hasPlayServices: async () => {
    console.log('[Expo Go] Google Sign-In mock - hasPlayServices called');
    return true;
  },
  signIn: async () => {
    throw new Error('Google Sign-In is not available in Expo Go. Please use a development build or create a release build to test this feature. See GOOGLE_SIGNIN_FIX.md for more details.');
  },
  getTokens: async () => {
    console.log('[Expo Go] Google Sign-In mock - getTokens called');
    return { accessToken: '', idToken: '' };
  },
  hasPreviousSignIn: () => {
    console.log('[Expo Go] Google Sign-In mock - hasPreviousSignIn called');
    return false;
  },
  getCurrentUser: () => {
    console.log('[Expo Go] Google Sign-In mock - getCurrentUser called');
    return null;
  },
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export const isSuccessResponse = () => false;
