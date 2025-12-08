# Design Document: React Native CLI to Expo Migration

## Overview

This design document outlines the technical approach for migrating the StudyManager React Native CLI application to Expo. The migration will use Expo's prebuild approach, which allows us to maintain native code customizations while benefiting from Expo's development tools, faster iteration cycles, and simplified build process.

The migration strategy focuses on:
1. Installing and configuring Expo in the existing project
2. Replacing incompatible packages with Expo-compatible alternatives
3. Updating configuration files for Expo's build system
4. Preserving all existing functionality
5. Enabling fast refresh and hot reload capabilities

## Architecture

### Current Architecture (React Native CLI)
```
StudyManager (React Native CLI)
├── android/          (Native Android code)
├── ios/              (Native iOS code)
├── src/              (React Native TypeScript code)
│   ├── components/
│   ├── context/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   └── types/
├── App.tsx
├── index.js          (Entry point using AppRegistry)
└── package.json
```

### Target Architecture (Expo with Prebuild)
```
StudyManager (Expo)
├── .expo/            (Generated Expo files - gitignored)
├── android/          (Generated via prebuild - gitignored)
├── ios/              (Generated via prebuild - gitignored)
├── src/              (React Native TypeScript code - unchanged)
│   ├── components/
│   ├── context/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   └── types/
├── App.tsx
├── index.js          (Entry point using registerRootComponent)
├── app.json          (Expo configuration)
├── babel.config.js   (Updated for Expo)
└── package.json      (Updated dependencies and scripts)
```

## Components and Interfaces

### 1. Package Migration

#### Dependencies to Replace
| Current Package | Expo Alternative | Reason |
|----------------|------------------|---------|
| react-native-vector-icons | @expo/vector-icons | Built-in Expo support, no native linking required |
| @react-native-google-signin/google-signin | expo-auth-session + expo-web-browser | Expo-compatible OAuth flow |
| @react-native-async-storage/async-storage | @react-native-async-storage/async-storage | Already compatible, no change needed |

#### Dependencies to Keep (Already Compatible)
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- @supabase/supabase-js
- react-native-webview
- react-native-calendars
- react-native-date-picker
- react-native-gesture-handler
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- react-native-paper

### 2. Configuration Files

#### app.json Structure
```json
{
  "expo": {
    "name": "StudyManager",
    "slug": "study-manager",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.studymanager.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.studymanager"
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0"
          },
          "ios": {
            "deploymentTarget": "13.4"
          }
        }
      ]
    ]
  }
}
```

#### babel.config.js Update
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin'
    ]
  };
};
```

#### metro.config.js Update
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

### 3. Entry Point Modification

#### Current (index.js)
```javascript
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

#### Target (index.js)
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

### 4. Icon Migration Strategy

#### Import Pattern Changes
```typescript
// Before (react-native-vector-icons)
import Icon from 'react-native-vector-icons/MaterialIcons';

// After (@expo/vector-icons)
import { MaterialIcons } from '@expo/vector-icons';
// or
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
```

#### Component Usage Changes
```typescript
// Before
<Icon name="add" size={24} color="#FFFFFF" />

// After
<MaterialIcons name="add" size={24} color="#FFFFFF" />
```

### 5. Google Sign-In Migration

Since @react-native-google-signin/google-signin is not compatible with Expo Go, we have two options:

#### Option A: Use Expo Auth Session (Recommended)
```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// In component
const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID',
});
```

#### Option B: Create Development Build
If the current Google Sign-In implementation must be preserved:
1. Keep @react-native-google-signin/google-signin
2. Create a development build using `eas build --profile development`
3. Install the development build on devices for testing
4. Note: Cannot use Expo Go for testing

## Data Models

No changes to existing data models. All TypeScript interfaces and types remain unchanged:
- User
- Task
- Canvas assignment structures
- Google Calendar event structures

## Correct
ness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


After analyzing the acceptance criteria, most of them are specific validation checks or example tests rather than universal properties. However, two key properties emerge:

**Property 1: Icon rendering consistency across screens**
*For any* screen in the application, when the screen is rendered, all MaterialIcons components should display correctly without showing missing glyph symbols or rendering errors.
**Validates: Requirements 2.1**

**Property 2: Navigation flow preservation**
*For any* valid navigation path in the original application, the same navigation path should work identically in the migrated Expo application, maintaining the same screen transitions and state preservation.
**Validates: Requirements 4.5**

Note: The majority of acceptance criteria for this migration are best validated through example-based testing and manual verification rather than property-based testing, as they involve:
- One-time configuration validations (checking files exist, contain specific values)
- Build process verification (ensuring builds complete successfully)
- Integration testing (verifying external services like Supabase still work)
- Documentation completeness checks

## Error Handling

### Migration Errors

1. **Package Installation Failures**
   - Error: Incompatible package versions
   - Handling: Use `npx expo install` to automatically resolve compatible versions
   - Fallback: Manually specify compatible versions based on Expo SDK version

2. **Prebuild Failures**
   - Error: Native code conflicts during prebuild
   - Handling: Clean android/ios directories and retry
   - Fallback: Manually resolve conflicts in app.json configuration

3. **Icon Rendering Issues**
   - Error: Icons not displaying after migration
   - Handling: Verify @expo/vector-icons is installed and imports are updated
   - Fallback: Use expo-font to manually load icon fonts

4. **Build Errors**
   - Error: Android/iOS build failures
   - Handling: Check app.json for missing configuration
   - Fallback: Use EAS Build for cloud building with better error messages

### Runtime Errors

1. **Authentication Failures**
   - Error: Supabase auth not working
   - Handling: Verify react-native-url-polyfill is installed
   - Logging: Log auth errors with detailed messages

2. **Storage Errors**
   - Error: AsyncStorage not persisting data
   - Handling: Verify @react-native-async-storage/async-storage is properly installed
   - Fallback: Clear storage and reinitialize

3. **Network Errors**
   - Error: API calls failing
   - Handling: Verify network permissions in app.json
   - Logging: Log network errors with request details

## Testing Strategy

### Manual Testing Approach

Since this is a migration project, testing will primarily be manual verification rather than automated testing:

#### 1. Pre-Migration Baseline
- Document current app behavior
- Take screenshots of all screens
- Test all user flows and document expected behavior
- Note all features that require testing post-migration

#### 2. Post-Migration Verification

**Configuration Validation**
- Verify app.json contains all required fields
- Check that package.json has correct dependencies
- Confirm babel.config.js and metro.config.js are updated
- Validate tsconfig.json extends Expo configuration

**Build Verification**
- Run `npx expo prebuild` successfully
- Build Android app using `npx expo run:android`
- Build iOS app using `npx expo run:ios`
- Verify no build errors or warnings

**Functional Testing**
- Test authentication flow (sign in, sign up, sign out)
- Verify task list displays correctly
- Test task creation and editing
- Verify Canvas integration works
- Test calendar functionality
- Check all navigation flows
- Verify AsyncStorage persistence
- Test all icon displays across screens

**Development Experience**
- Verify hot reload works when editing files
- Test that Expo dev tools are accessible
- Confirm fast refresh works correctly

#### 3. Icon Migration Testing

**Visual Verification**
- Navigate to each screen in the app
- Verify all icons display correctly
- Check that icon sizes and colors match original
- Test icon buttons are clickable

**Code Verification**
- Search codebase for `react-native-vector-icons` imports (should find none)
- Verify all imports use `@expo/vector-icons`
- Check that icon names are correct for @expo/vector-icons API

#### 4. Integration Testing

**Supabase Integration**
- Test user authentication
- Verify database queries work
- Test real-time subscriptions if used
- Verify file uploads if used

**Canvas Integration**
- Test Canvas API authentication
- Verify assignment fetching
- Test assignment synchronization

**Google Calendar Integration**
- Test calendar authentication (if using new expo-auth-session)
- Verify event fetching
- Test event creation

### Unit Testing (Minimal)

While this is primarily a migration, we can add minimal unit tests for critical utilities:

**Test Framework**: Jest (already configured)

**Test Coverage**:
- Icon import verification (ensure no old imports remain)
- Configuration validation (app.json structure)
- Entry point verification (registerRootComponent usage)

Example test structure:
```typescript
// __tests__/migration-verification.test.ts
describe('Expo Migration Verification', () => {
  it('should not have react-native-vector-icons imports', () => {
    // Search codebase for old imports
  });

  it('should use registerRootComponent in entry file', () => {
    // Verify index.js uses correct entry point
  });

  it('should have valid app.json configuration', () => {
    // Validate app.json structure
  });
});
```

### Property-Based Testing

For the two identified properties, we can implement property-based tests:

**Testing Framework**: fast-check (JavaScript property-based testing library)

**Property 1: Icon Rendering**
```typescript
// Test that icons render without errors across different icon names
import fc from 'fast-check';
import { render } from '@testing-library/react-native';
import { MaterialIcons } from '@expo/vector-icons';

test('Property 1: All valid MaterialIcons names render without error', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.keys(MaterialIcons.glyphMap)),
      (iconName) => {
        const { queryByTestId } = render(
          <MaterialIcons name={iconName} size={24} testID="icon" />
        );
        expect(queryByTestId('icon')).toBeTruthy();
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property 2: Navigation Preservation**
```typescript
// Test that navigation paths work consistently
import fc from 'fast-check';

test('Property 2: Navigation paths work in migrated app', () => {
  const validNavigationPaths = [
    ['Dashboard'],
    ['Tasks'],
    ['Calendar'],
    ['Canvas'],
    ['Profile'],
    ['Dashboard', 'AddTask'],
    ['Tasks', 'TaskDetail'],
  ];

  fc.assert(
    fc.property(
      fc.constantFrom(...validNavigationPaths),
      (navigationPath) => {
        // Navigate through the path
        // Verify each screen renders successfully
        // This would require navigation testing utilities
      }
    ),
    { numRuns: 50 }
  );
});
```

### Acceptance Testing

Create a checklist based on all acceptance criteria:

**Requirement 1: Expo Migration**
- [ ] App runs with `npx expo start`
- [ ] Hot reload works when editing files
- [ ] Android build completes successfully
- [ ] iOS build completes successfully
- [ ] All dependencies are Expo-compatible

**Requirement 2: Vector Icons**
- [ ] All screens display icons correctly
- [ ] @expo/vector-icons provides MaterialIcons
- [ ] Icon fonts included in build
- [ ] No react-native-vector-icons imports remain

**Requirement 3: Native Modules**
- [ ] Google Sign-In solution implemented
- [ ] Development build configured if needed
- [ ] Documentation for development builds exists
- [ ] Incompatible packages identified
- [ ] Alternatives provided for incompatible packages

**Requirement 4: Functionality Preservation**
- [ ] Supabase authentication works
- [ ] Tasks display correctly
- [ ] Canvas sync works
- [ ] Calendar interactions work
- [ ] All navigation flows work
- [ ] AsyncStorage persists data
- [ ] Network requests succeed

**Requirement 5: Configuration**
- [ ] app.json exists and is valid
- [ ] App name, bundle ID, version specified
- [ ] Permissions declared
- [ ] Splash screen and icons configured
- [ ] iOS configuration complete
- [ ] Android configuration complete

**Requirement 6: Scripts**
- [ ] `npm start` launches Expo dev server
- [ ] `npm run android` builds Android app
- [ ] `npm run ios` builds iOS app
- [ ] Production build scripts exist
- [ ] Development build scripts exist if needed

**Requirement 7: TypeScript**
- [ ] TypeScript recognizes Expo types
- [ ] tsconfig.json extends Expo config
- [ ] TypeScript errors reported correctly

**Requirement 8: Documentation**
- [ ] Migration summary provided
- [ ] Package replacements documented
- [ ] Development build instructions included
- [ ] Build and test instructions included
- [ ] Breaking changes documented

## Migration Execution Plan

### Phase 1: Preparation
1. Commit all current changes to version control
2. Create a new branch for migration
3. Document current app behavior and take screenshots
4. Back up android and ios directories

### Phase 2: Install Expo
1. Install expo package: `npm install expo`
2. Install Expo CLI globally: `npm install -g @expo/cli`
3. Update entry point to use registerRootComponent

### Phase 3: Update Dependencies
1. Replace react-native-vector-icons with @expo/vector-icons
2. Update babel.config.js to use babel-preset-expo
3. Update metro.config.js for Expo
4. Install any missing Expo dependencies

### Phase 4: Create Configuration
1. Create comprehensive app.json with all settings
2. Configure iOS and Android specific settings
3. Add splash screen and icon assets
4. Configure permissions

### Phase 5: Update Code
1. Replace all icon imports throughout codebase
2. Update any incompatible package usage
3. Fix any TypeScript errors

### Phase 6: Prebuild
1. Run `npx expo prebuild --clean`
2. Verify android and ios directories are generated
3. Add android and ios to .gitignore

### Phase 7: Testing
1. Test development server: `npx expo start`
2. Test Android build: `npx expo run:android`
3. Test iOS build: `npx expo run:ios`
4. Verify all functionality works
5. Test hot reload and fast refresh

### Phase 8: Documentation
1. Create migration summary document
2. Update README with new development instructions
3. Document any breaking changes
4. Add troubleshooting guide

## Rollback Strategy

If migration fails or causes critical issues:

1. **Immediate Rollback**
   - Revert to previous git commit
   - Restore android and ios directories from backup
   - Reinstall original dependencies

2. **Partial Rollback**
   - Keep Expo installed but revert specific changes
   - Use git to selectively revert problematic commits
   - Maintain version control of each migration step

3. **Hybrid Approach**
   - Keep some Expo benefits (like @expo/vector-icons)
   - Revert to React Native CLI for builds
   - Use Expo modules without full Expo workflow

## Performance Considerations

1. **Bundle Size**
   - Expo may increase bundle size slightly
   - Monitor app size before and after migration
   - Use production builds for accurate size comparison

2. **Build Time**
   - Initial prebuild may take longer
   - Subsequent builds should be faster
   - Development builds enable faster iteration

3. **Runtime Performance**
   - No expected runtime performance impact
   - Expo adds minimal overhead
   - Test app performance on real devices

## Security Considerations

1. **API Keys and Secrets**
   - Ensure .env file is in .gitignore
   - Don't commit Supabase keys to version control
   - Use Expo's secure storage for sensitive data

2. **Permissions**
   - Review all permissions in app.json
   - Only request necessary permissions
   - Document why each permission is needed

3. **Dependencies**
   - Audit all dependencies for vulnerabilities
   - Keep Expo SDK updated
   - Monitor security advisories

## Future Enhancements

After successful migration, consider:

1. **EAS Build**
   - Set up cloud building with EAS
   - Configure build profiles
   - Automate builds with CI/CD

2. **EAS Update**
   - Enable over-the-air updates
   - Push fixes without app store review
   - A/B test features

3. **Expo Dev Client**
   - Create custom development build
   - Include all native modules
   - Share with team members

4. **Web Support**
   - Add web platform support
   - Share code across mobile and web
   - Deploy web version

## Conclusion

This migration from React Native CLI to Expo will significantly improve the development experience while preserving all existing functionality. The key challenges are icon migration and handling native modules, both of which have clear solutions. The migration is reversible and can be done incrementally, reducing risk.
