import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { isExpoGo } from '../utils/googleSignInConfig';

/**
 * Optional banner component to show when running in Expo Go
 * Add this to your main screens if you want a visual indicator
 * 
 * Usage:
 * import ExpoGoBanner from '../components/ExpoGoBanner';
 * 
 * <ExpoGoBanner />
 */
const ExpoGoBanner: React.FC = () => {
  if (!isExpoGo) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        📱 Running in Expo Go - Google Calendar disabled
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  bannerText: {
    color: '#92400E',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ExpoGoBanner;
