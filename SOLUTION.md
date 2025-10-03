# StudyManager - Issue Solutions

This document explains how to fix the two main issues you're experiencing:

1. **Network request failed** error when fetching user profile
2. **Google Calendar DEVELOPER_ERROR** when connecting to Google Calendar

## Issue 1: Network Request Failed (Supabase Connection)

### Problem
The error "TypeError: Network request failed" indicates that your app cannot connect to the Supabase backend.

### Solutions Applied

1. **Network Security Configuration**: Updated `android/app/src/main/res/xml/network_security_config.xml` to allow connections to Supabase domains:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">supabase.co</domain>
        <domain includeSubdomains="true">googleapis.com</domain>
    </domain-config>
</network-security-config>
```

2. **Enhanced Error Handling**: Added better error handling in [AuthContext.tsx](file:///e:/Rmz1Project/StudyManager/src/context/AuthContext.tsx) to provide more specific error messages.

3. **Supabase Configuration**: Added global error handling and headers in [supabase.ts](file:///e:/Rmz1Project/StudyManager/src/services/supabase.ts).

### Additional Troubleshooting Steps

1. **Check Internet Connection**: Ensure your device/emulator has internet access.

2. **Verify Supabase Credentials**: Make sure the `supabaseUrl` and `supabaseAnonKey` in [supabase.ts](file:///e:/Rmz1Project/StudyManager/src/services/supabase.ts) are correct.

3. **Database Setup**: Run the SQL script in [supabase.ts](file:///e:/Rmz1Project/StudyManager/src/services/supabase.ts) to create the required tables and policies in your Supabase project.

4. **Firewall/Antivirus**: Check if any firewall or antivirus is blocking the connection.

## Issue 2: Google Calendar DEVELOPER_ERROR

### Problem
The "DEVELOPER_ERROR" indicates that Google Sign-in is not properly configured for your Android app.

### Root Cause
The main issue is the missing `google-services.json` file, which is required for Google Sign-in to work properly.

### Solutions Applied

1. **Improved Error Handling**: Enhanced error messages in [CalendarScreen.tsx](file:///e:/Rmz1Project/StudyManager/src/screens/main/CalendarScreen.tsx) to provide more specific information.

2. **Updated README**: Added comprehensive setup instructions in [README.md](file:///e:/Rmz1Project/StudyManager/README.md).

### Complete Setup Instructions

To fix the Google Calendar integration, follow these steps:

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Configure OAuth Consent Screen**:
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Fill in the required app information
   - Add the following scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Save the consent screen

4. **Create OAuth 2.0 Credentials**:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Android" as the application type
   - Enter your app's package name: `com.studymanager`
   - Generate and enter the SHA-1 certificate fingerprint
   - Download the `google-services.json` file

5. **Place the Configuration File**:
   - Place the downloaded `google-services.json` file in the `android/app/` directory

6. **Update Gradle Files**:
   - Update `android/build.gradle` to include the Google services classpath:
     ```gradle
     buildscript {
       dependencies {
         classpath 'com.google.gms:google-services:4.3.15'
       }
     }
     ```
   - Update `android/app/build.gradle` to apply the Google services plugin:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```

7. **Update Web Client ID**:
   - Update the `webClientId` in [CalendarScreen.tsx](file:///e:/Rmz1Project/StudyManager/src/screens/main/CalendarScreen.tsx) with your web client ID from the Google Cloud Console

### Testing the Fix

1. **Rebuild the App**:
   ```bash
   npm run android
   ```

2. **Verify Network Configuration**:
   - Test Supabase connection by trying to log in
   - Check that no network errors appear in the console

3. **Test Google Calendar Integration**:
   - Navigate to the Calendar screen
   - Tap "Connect" to initiate Google Sign-in
   - You should see the Google Sign-in dialog

## Additional Notes

- Make sure you're using the correct SHA-1 fingerprint for your development environment
- If you're building release versions, you'll need to add the release SHA-1 fingerprint as well
- The Google Calendar integration requires a properly configured OAuth consent screen that has been verified by Google if you're planning to release the app publicly

## Need Help?

If you continue to experience issues:

1. Check the React Native logs for detailed error messages
2. Verify all configuration files are in the correct locations
3. Ensure all required dependencies are installed
4. Check that your Google Cloud project is properly configured

For more detailed troubleshooting, refer to the [React Native Google Sign-in documentation](https://react-native-google-signin.github.io/docs).