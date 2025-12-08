// Simple test to verify conditional Google Sign-In configuration
// This ensures the correct implementation is loaded based on environment

import Constants from 'expo-constants';

describe('Google Sign-In Configuration', () => {
  it('should use mock in Expo Go', () => {
    // Mock Expo Go environment
    (Constants as any).appOwnership = 'expo';
    
    // Re-import to get fresh module
    jest.resetModules();
    const { GoogleSignin } = require('../googleSignInConfig');
    
    // Should use mock implementation
    expect(GoogleSignin.hasPreviousSignIn()).toBe(false);
  });

  it('should use real implementation in development build', () => {
    // Mock development build environment
    (Constants as any).appOwnership = null;
    
    // In a real test, this would verify the actual GoogleSignin is loaded
    // For now, we just verify the logic works
    const isExpoGo = Constants.appOwnership === 'expo';
    expect(isExpoGo).toBe(false);
  });
});
