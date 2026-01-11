# HIKU Frontend - Technical Documentation

## Overview

The **HIKU Frontend** is a cross-platform mobile application built with React Native and Expo, providing hikers with interactive trail maps, social features, user profiles, and activity tracking. The application integrates Mapbox for rich cartographic visualization, supports Android and Web deployment, and consumes REST APIs from multiple backend microservices. The architecture emphasizes modularity with separated page components, strongly-typed data models, and platform-specific rendering strategies.

## Table of Contents

1. [Architecture](#architecture)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Type Definitions](#type-definitions)
5. [Mapbox Integration](#mapbox-integration)
6. [Utilities](#utilities)
7. [Authentication & Authorization](#authentication--authorization)
8. [Configuration](#configuration)
9. [Local Development](#local-development)
10. [Android Deployment](#android-deployment)
11. [Web Deployment](#web-deployment)
12. [Error Handling](#error-handling)
13. [Troubleshooting](#troubleshooting)

---

## Architecture

### Key Components

- **Page Components**: Architecturally separated screens for each feature (index, social-feed, badge-service, activity-service, my-posts, user-profile)
- **Context Providers**: AuthContext manages authentication state and Keycloak integration across the app
- **API Layer**: Centralized HTTP client modules (api.ts, feedApi.ts, userApi.ts, scoreboardApi.ts) for backend communication
- **Type Definitions**: Strongly-typed TypeScript interfaces for Peaks and Trails separated into dedicated files
- **Routing**: Expo Router provides file-based navigation with Stack navigator
- **Platform Abstraction**: Conditional rendering for native (React Native Mapbox) vs web (mapbox-gl) environments
- **Utility Modules**: Color assignment, authentication helpers, app configuration

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React Native | 0.81.5 |
| **Runtime** | React | 19.1.0 |
| **Build Platform** | Expo | ~54.0.25 |
| **Routing** | Expo Router | ~6.0.15 |
| **Language** | TypeScript | Latest |
| **Maps (Native)** | @rnmapbox/maps | 10.2.10 |
| **Maps (Web)** | mapbox-gl + react-map-gl | 2.15.0 / 8.1.0 |
| **Authentication** | Keycloak JS | 26.2.2 |
| **Image Handling** | expo-image-picker | 17.0.10 |
| **Gestures** | react-native-gesture-handler | 2.28.0 |
| **Navigation** | @react-navigation/native | 7.1.8 |

## Application Structure

### Architectural Principles

The HIKU frontend follows a **page-based architecture** where each screen is an independent, self-contained component:

**Screen Separation Strategy**:
- Each user-facing feature resides in its own file under `app/` directory
- Screens are logically isolated with minimal cross-dependencies
- Shared state managed through Context API (AuthContext)
- Navigation handled declaratively via Expo Router file structure

**Page Components**:
- **index.tsx**: Main landing page with interactive Mapbox map showing trails and peaks
- **social-feed.tsx**: Social networking feed displaying user posts and hiking activity
- **my-posts.tsx**: User's own posts with image upload and creation functionality
- **badge-service.tsx**: Personal logbook of conquered peaks with achievement tracking
- **activity-service.tsx**: Activity planning 
- **user-profile.tsx**: Public user profile view
- **my-user-profile.tsx**: Personal profile management with editable fields
- **scoreboards-challenges.tsx**: Leaderboards and community challenges
- **login.tsx**: Authentication entry point with Keycloak integration
- **finish-signup.tsx**: Post-authentication profile completion

## Type Definitions

### Separated Type Files

Geographic data types are **architecturally separated** into dedicated files to enforce type safety and domain clarity:

#### app/types/peaks.ts
Defines all peak-related data structures:
- **PeakGeometryDto**: Point geometry with WGS84 coordinates
- **PeakDto**: Peak entity with elevation, territory, and location metadata
- **PeakFeature**: GeoJSON Feature format for Mapbox rendering with styled properties
- **LogbookEntry**: User achievement records linking peaks to completion dates and notes

#### app/types/trails.ts
Defines all trail-related data structures:
- **GeometryDto**: LineString geometry representing trail paths
- **PointGeometryDto**: Point geometry for trail-associated peaks
- **TrailDto**: Trail entity with name, length, and GPX source metadata
- **TrailFeature**: GeoJSON Feature format for Mapbox LineString visualization
- **TrailFeatureCollection**: Collection wrapper for multiple trail features
- **PeakFeature**: Trail-specific peak representation for trail-peak associations

This architectural approach emphasizes type safety through compile-time validation, reducing the risk of runtime errors caused by API mismatches. It clearly separates domains, as peaks and trails are distinct entities handled by different backend services, while remaining compliant with GeoJSON standards expected by Mapbox. By reusing shared types across multiple components, the system stays consistent and easier to maintain, since any backend API change needs to be addressed in only one place.

**Duplicate Type Handling**:
Note that `PeakDto` and `PeakFeature` appear in both files due to different usage contexts:
- `peaks.ts`: Used for Badge Service logbook and peak-centric views
- `trails.ts`: Used for trail-peak relationships in map rendering

This intentional duplication prevents circular dependencies and keeps concerns separated.

## Mapbox Integration

### Platform-Specific Rendering

The application uses **conditional imports and rendering** to support both native mobile (Android/iOS) and web platforms:

**Native Platforms (Android/iOS)**:
- Uses `@rnmapbox/maps` library
- Renders native OpenGL map views with hardware acceleration
- Components: MapView, Camera, ShapeSource, LineLayer, PointAnnotation
- Access token set via `Mapbox.setAccessToken()` on module initialization

**Web Platform**:
- Uses `mapbox-gl` library with React wrapper
- Renders WebGL-based interactive maps in browser
- Creates map instance programmatically, adds sources and layers dynamically
- Requires DOM manipulation for map container mounting

The cross-platform strategy relies on detecting the platform using `Platform.OS` or conditional imports, which allows the application to adapt its behavior accordingly. Rendering logic is separated into different branches for native and web environments, while core data structures such as GeoJSON FeatureCollections are shared across all platforms. Access tokens are managed through environment variables or centralized constants, ensuring consistent and secure configuration regardless of the target platform.

### Trail and Peak Visualization

**Trail Rendering**:
- Trails fetched from Peaks-Hikes Service REST API as `TrailDto[]` array
- Converted to GeoJSON `TrailFeatureCollection` with LineString geometries
- Each trail assigned a distinct color via color assignment utility
- Rendered as LineLayer on Mapbox with configurable stroke width and color properties

**Peak Rendering**:
- Peaks fetched as `PeakDto[]` array with Point geometries
- Converted to `PeakFeature[]` array with GeoJSON Feature structure
- Rendered as PointAnnotation markers (native) or CircleLayer (web)
- Interactive markers support tap/click events for peak detail display

**Data Flow**:
```
[Component Mounts]
        │
        ▼
[Fetch Trails & Peaks from Backend APIs]
        │
        ▼
[Transform API Responses to GeoJSON]
        │
        ▼
[Assign Colors Using Shuffled Palette]
        │
        ▼
[Create FeatureCollection]
        │
        ▼
[Pass to Mapbox ShapeSource / addSource]
        │
        ▼
[Apply Styling via LineLayer / addLayer]
        │
        ▼
[User Interaction]
        │
        ▼
[Navigate to Detail Screens]
```
### Mapbox Configuration

**Access Token Management**:
- Token stored as constant in component or environment variable
- Public token safe for client-side usage
- Required for both native and web Mapbox SDKs

**Camera Control**:
- Initial camera centers on default region (e.g., Slovenia)
- Zoom level configured for optimal trail visibility
- Pitch and bearing adjustable for 3D terrain visualization
- Programmatic camera updates via Camera component (native) or flyTo method (web)

**Performance Considerations**:
- GeoJSON sources cached to prevent unnecessary re-renders
- Color assignment performed once on data fetch
- Map instance lifecycle managed to avoid memory leaks
- Large trail collections may require clustering or viewport filtering

## Utilities

### Color Assignment Utility

Location: `app/utils/colors.ts`

The color assignment utility provides a centralized palette of 20 distinct hex colors with high contrast and accessibility, ensuring trails can be easily distinguished on maps. Colors are carefully selected to include warm tones (reds, oranges, yellows) and cool tones (blues, greens, purples), avoiding grayscale to maximize visibility. The `assignDistinctColors()` function shuffles the palette and assigns colors to features using modulo arithmetic, cycling through the palette for large datasets. This approach guarantees visual clarity for overlapping trails, maintains consistency during user sessions, and scales gracefully without code changes. When trails are fetched, they are passed through this function before Mapbox rendering, ensuring each trail line displays with a unique color.


### Image Picker Integration

Location: `app/my-posts.tsx`

The image upload management uses Expo's `ImagePicker` module to provide cross-platform image selection from device gallery across Android, iOS, and Web platforms with a unified API. When users tap "Choose Image", the native photo picker opens, returns a URI to the selected image, which is stored in component state for preview. Configuration options allow restricting to images only, enabling cropping, defining aspect ratios, and setting compression quality to reduce upload size. Expo automatically requests required permissions (CAMERA_ROLL on Android, Info.plist entries on iOS), with graceful handling of permission denials. On post submission, the image URI is sent to the backend via multipart/form-data, processed by the Social Feed or Activity Service, and the returned image URL is persisted with the post. Upload failures, network timeouts, and size limit rejections are handled with error messages and retry logic.

### Icon Retrieval

Icons and user-uploaded images are retrieved from the backend using image URLs stored in post, user profile, and logbook entities. When components render feeds or profiles, image URLs are passed to the `<Image>` component from `expo-image`, which handles caching and lazy loading across platforms. The application maintains authentication tokens in request headers to ensure secure access to private user images, preventing unauthorized access to protected resources.

## Authentication & Authorization

### Keycloak Integration

The HIKU frontend uses **Keycloak JS** library for OpenID Connect authentication:

**Authentication Flow**:
1. User navigates to login screen
2. Keycloak client initialized with realm and client ID from configuration
3. User redirected to Keycloak login page
4. After successful authentication, Keycloak redirects back with authorization code
5. Keycloak JS exchanges code for access token and refresh token
6. Tokens stored in AuthContext state and persisted (if configured)
7. Access token included in all backend API requests via Authorization header

**AuthContext Provider**:
Location: `app/context/AuthContext.tsx`

- Manages authentication state globally across app
- Provides login, logout, and token refresh methods
- Exposes user profile information to child components
- Handles token expiration and automatic renewal

**Protected Routes**:
- Most screens require authenticated user
- Unauthenticated users redirected to login screen
- Post-login navigation returns to originally requested route

**API Request Authentication**:
Location: `app/lib/authFetch.ts`

- Wrapper around fetch() that injects Bearer token
- Automatically retrieves token from AuthContext
- Handles 401 responses by triggering re-authentication
- Simplifies API call implementation across components

## Android Deployment

### React Native Android Build Process

The HIKU frontend supports native Android deployment through Expo's managed workflow with Gradle-based build configuration. Expo SDK provides pre-built native modules (maps, image-picker, router), and `expo run:android` builds APK/AAB locally, requiring Android Studio SDK tools and JDK 17+. Build variants include debug (with Metro bundler), debugOptimized (production-like performance), and release (with ProGuard obfuscation and APK optimization). Native module autolinking automatically injects dependencies via `expo prebuild`, eliminating manual linking.

**Common Build Commands**:

```bash
# Generate native Android project from app.json
expo prebuild --clean

# Build and run on connected device or emulator
expo run:android

# Build release APK
cd android && ./gradlew assembleRelease

# Clean Gradle cache
./gradlew clean
```

**Signing and Distribution**:
Debug builds use auto-generated keystore; release builds require production keystore in `gradle.properties`. APK/AAB uploads to Google Play Console or enterprise distribution channels. CI/CD pipelines (`.github/workflows/`) automate builds on main branch push, with GitHub Actions running Gradle tasks and uploading test artifacts for QA.

**Performance Optimizations**: Hermes JavaScript engine, ProGuard code shrinking, asset compression, and bundle splitting reduce startup time and APK size.

## Configuration

### Environment Variables

Location: `app/lib/appConfig.ts`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_BASE_URL` | Backend REST API base URL | - | Yes |
| `KEYCLOAK_URL` | Keycloak authentication server URL | - | Yes |
| `KEYCLOAK_REALM` | Keycloak realm | hiku | Yes |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | hiku-frontend | Yes |
| `MAPBOX_ACCESS_TOKEN` | Mapbox public access token | - | Yes |
| `WEATHER_API_KEY` | Weather service API key | - | No |

### Application Configuration

Configuration managed via:
- **app.json**: Expo project configuration including package name, bundle identifier, permissions
- **package.json**: Dependencies, scripts, and version information
- **tsconfig.json**: TypeScript compiler options and path aliases

## Local Development

### Prerequisites

- **Node.js 18+** (LTS version recommended)
- **npm or yarn** package manager
- **Expo CLI** (installed via npx, no global install needed)
- **Android Studio** (for Android development with emulator)
- **Xcode** (for iOS development, macOS only)
- **Mapbox Access Token** (free tier available)
- **Backend services running** (Peaks-Hikes, Badge, Social Feed services)

### Running Locally

1. **Clone the repository**:
   Navigate to the frontend directory.

2. **Install dependencies**:
   Run `npm install` in the terminal.

3. **Configure environment variables**:
   Create `app/lib/appConfig.ts` with backend API URLs and Mapbox token.

4. **Start Expo development server**:
   Run `npm start` - this opens Expo DevTools in browser.

5. **Run on platforms**:
   - **Android**: Press `a` in terminal or `npm run android`
   - **iOS**: Press `i` in terminal or `npm run ios` (macOS only)
   - **Web**: Press `w` in terminal or `npm run web`

6. **Verify application**:
   - Mobile: Expo Go app or Android Emulator/iOS Simulator
   - Web: Browser opens at `http://localhost:8081`
   - Map should load with trails and peaks

## Web Deployment

The application also supports web deployment:

```bash
expo export --platform web
```

generates static HTML/JS/CSS bundle and:
- Mapbox GL JS renders maps in browser via WebGL
- CI/CD pipelines deploy to Azure Static Web Apps (see `.github/workflows/frontend-web-prod.yaml`)
- Responsive design adapts to desktop and mobile browsers

## Error Handling

### Common Error Scenarios

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| `200 OK` | Request successful | - |
| `400 Bad Request` | Invalid request data | Malformed JSON, missing required fields |
| `401 Unauthorized` | Missing or invalid authentication | Token expired, no Authorization header |
| `403 Forbidden` | Insufficient permissions | User lacks required role |
| `404 Not Found` | Resource not found | Invalid peak/trail ID |
| `500 Internal Server Error` | Backend service error | Database down, unhandled exception |

### Error Handling Strategy

**Network Errors**:
- Display user-friendly error messages
- Retry logic for transient failures
- Offline mode indication when backend unreachable

**Authentication Errors**:
- Automatic token refresh on 401 responses
- Redirect to login on refresh failure
- Clear session and prompt re-authentication

**Validation Errors**:
- Form-level validation before API calls
- Display inline error messages for invalid inputs
- Prevent submission until all fields valid

## Troubleshooting

### Metro Bundler Issues

**Problem**: Metro bundler fails to start or shows module resolution errors.

**Solution**:
- Clear Metro cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for duplicate dependencies in package.json
- Ensure all native modules are properly linked

### Android Build Failures

**Problem**: `expo run:android` fails with Gradle errors.

**Solution**:
- Clean Gradle cache: `cd android && ./gradlew clean`
- Update Android SDK tools in Android Studio
- Check JDK version (17+ required)
- Verify `ANDROID_HOME` environment variable points to SDK location
- Rebuild native modules: `npx expo prebuild --clean`

### Mapbox Not Rendering

**Problem**: Map shows blank screen or fails to load.

**Solution**:
- Verify Mapbox access token is valid and not expired
- Check network connectivity and API rate limits
- Ensure `@rnmapbox/maps` is properly linked (run `npx expo prebuild`)
- On web, check browser console for WebGL errors
- Verify GeoJSON data is properly formatted

### Authentication Errors

**Problem**: Login fails or tokens not persisting.

**Solution**:
- Verify Keycloak URL and realm configuration
- Check redirect URIs registered in Keycloak client settings
- Clear app data/cache on Android device
- Inspect network requests for 401/403 responses
- Ensure AuthContext is wrapping app root in _layout.tsx




## Contact

For questions or issues, contact the development team.


**Last Updated**: January 11, 2026  
**Version**: 0.1.0
