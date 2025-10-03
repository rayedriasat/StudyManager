import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const CanvasSetupScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Canvas LMS Integration</Text>
      <Text style={styles.text}>
        This app connects with Canvas LMS to fetch your assignments and todos. 
        To enable the integration:
      </Text>
      <Text style={styles.subtitle}>Steps to get Canvas Access Token:</Text>
      <Text style={styles.text}>
        1. Log into your Canvas web account.{'\n'}
        2. Go to Account &gt; Settings.{'\n'}
        3. Scroll down to 'Approved Integrations' or 'Access Tokens'.{'\n'}
        4. Click on 'New Access Token' or similar option.{'\n'}
        5. Create a token with appropriate scopes (read-only is enough).{'\n'}
        6. Copy the token and paste it in the Canvas setup screen in the app.
      </Text>
      <Text style={styles.subtitle}>Canvas URL</Text>
      <Text style={styles.text}>
        Typically your Canvas URL looks like https://your-school.instructure.com
      </Text>
      <Text style={styles.text}>
        You need to provide both the Canvas URL and Access Token on the Canvas setup screen.
      </Text>
      <Text style={styles.footer}>
        After connecting, your assignments will sync automatically.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#1F2937',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  footer: {
    marginTop: 24,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
  },
});

export default CanvasSetupScreen;
