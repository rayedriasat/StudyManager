import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import CanvasService from '../../services/canvasService';

const PRESET_URLS = [
  { label: 'North South University', value: 'https://northsouth.instructure.com' },
  { label: 'Custom URL', value: '' },
];

const CanvasSetupScreen = ({ navigation }: any) => {
  const { user, updateUserProfile } = useAuth();
  
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const getCanvasUrl = useCallback(() => {
    if (selectedPreset === 0) {
      return PRESET_URLS[0].value;
    }
    return customUrl.trim();
  }, [selectedPreset, customUrl]);

  const validateInputs = useCallback(() => {
    const url = getCanvasUrl();
    
    if (!url) {
      Alert.alert('Missing URL', 'Please enter your Canvas URL or select a preset.');
      return false;
    }

    if (!accessToken.trim()) {
      Alert.alert('Missing Token', 'Please enter your Canvas access token.');
      return false;
    }

    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        Alert.alert('Invalid URL', 'Canvas URL must start with http:// or https://');
        return false;
      }
    } catch (error) {
      Alert.alert('Invalid URL', 'Please enter a valid Canvas URL (e.g., https://school.instructure.com)');
      return false;
    }

    return true;
  }, [getCanvasUrl, accessToken]);

  const handleConnect = async () => {
    if (!validateInputs()) {
      return;
    }

    const url = getCanvasUrl();
    const token = accessToken.trim();

    try {
      setLoading(true);
      
      const canvasService = new CanvasService(url, token);
      const isValid = await canvasService.validateToken();

      if (!isValid) {
        Alert.alert(
          'Connection Failed',
          'Unable to connect to Canvas. Please check:\n\n' +
          '• Your Canvas URL is correct\n' +
          '• Your access token is valid\n' +
          '• You have internet connection\n' +
          '• The token has not expired'
        );
        return;
      }

      await updateUserProfile({
        canvas_url: url,
        canvas_token: token,
      });

      Alert.alert(
        'Success!',
        'Canvas has been connected successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Canvas');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Canvas setup error:', error);
      
      let errorMessage = 'Failed to connect to Canvas. ';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage += 'Invalid access token.';
        } else if (error.response.status === 404) {
          errorMessage += 'Canvas URL not found. Please check the URL.';
        } else {
          errorMessage += `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Check your internet connection.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Icon name="school" size={64} color="#6366F1" />
          <Text style={styles.title}>Connect to Canvas</Text>
          <Text style={styles.subtitle}>
            Sync your assignments and stay on top of your coursework
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Canvas URL</Text>
          
          <View style={styles.presetContainer}>
            {PRESET_URLS.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.presetButton,
                  selectedPreset === index && styles.presetButtonActive,
                ]}
                onPress={() => setSelectedPreset(index)}
                activeOpacity={0.7}
              >
                <View style={styles.radioOuter}>
                  {selectedPreset === index && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.presetLabel,
                    selectedPreset === index && styles.presetLabelActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPreset === 1 && (
            <TextInput
              style={styles.input}
              placeholder="https://your-school.instructure.com"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="url"
              returnKeyType="next"
              editable={!loading}
            />
          )}

          {selectedPreset === 0 && (
            <View style={styles.urlPreview}>
              <Icon name="link" size={16} color="#6B7280" />
              <Text style={styles.urlPreviewText}>{PRESET_URLS[0].value}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Access Token</Text>
            <TouchableOpacity
              onPress={() => setShowInstructions(!showInstructions)}
              style={styles.helpButton}
            >
              <Icon
                name={showInstructions ? 'help' : 'help-outline'}
                size={20}
                color="#6366F1"
              />
              <Text style={styles.helpText}>How to get token?</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Paste your Canvas access token here"
            value={accessToken}
            onChangeText={setAccessToken}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            onSubmitEditing={handleConnect}
            editable={!loading}
            onFocus={() => {
              // Small delay to ensure keyboard is up before scrolling
              setTimeout(() => {
                // This will be handled by KeyboardAvoidingView
              }, 100);
            }}
          />
        </View>

        {showInstructions && (
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Icon name="info" size={20} color="#6366F1" />
              <Text style={styles.instructionsTitle}>How to get your Access Token</Text>
            </View>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Log into your Canvas account on the web</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Click on Account → Settings</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Scroll down to "Approved Integrations"</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>Click "+ New Access Token"</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <Text style={styles.stepText}>Give it a name (e.g., "My App") and generate</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>6</Text>
                </View>
                <Text style={styles.stepText}>Copy the token and paste it above</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Icon name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Keep your token secure! Don't share it with anyone.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.connectButtonText}>Connecting...</Text>
            </>
          ) : (
            <>
              <Icon name="link" size={20} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect to Canvas</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Icon name="lock" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            Your credentials are stored securely on your device
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  presetContainer: {
    gap: 12,
    marginBottom: 12,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  presetButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  presetLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  presetLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  urlPreviewText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructionsList: {
    gap: 12,
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    paddingTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default CanvasSetupScreen;
