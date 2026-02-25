# Android TV Launcher - Implementation Guide

## Overview

This Android TV native app serves as a hotel home launcher, replacing the default Android TV UI with a branded hotel interface.

## Key Features Implemented

### 1. Home Launcher Functionality

**MainActivity.kt** handles:
- Full-screen launcher UI
- Remote control navigation (D-pad)
- Clock and date display
- Weather widget
- Device pairing code display
- Quick actions bar

**BootReceiver.kt**:
- Auto-starts launcher on TV boot
- Ensures launcher is always running

### 2. CMS Integration

**HotelApiService.kt** defines API endpoints:
```kotlin
interface HotelApiService {
    suspend fun requestCode(request: PairingRequest): PairingResponse
    suspend fun checkPairingStatus(deviceId: String): PairingStatusResponse
    suspend fun getHotelById(hotelId: Int): HotelResponse
    suspend fun getTVAppsByHotel(hotelId: Int): TVAppsResponse
    suspend fun getWeather(hotelId: Int): WeatherResponse
}
```

**Pairing Flow**:
1. App generates device ID
2. Requests pairing code from CMS
3. User enters code in CMS Devices page
4. App polls for pairing status
5. On success, fetches hotel branding & apps

### 3. Settings Protection

Password-protected settings menu:
- Default password: `9988`
- Changeable via CMS or app settings
- Access via Menu button on remote

Settings options:
- Change CMS URL
- Change Password
- Reset Pairing
- About

### 4. UI Components

**Layout Files**:
- `activity_main.xml` - Main launcher screen
- `item_app.xml` - App grid items

**Drawables**:
- `launcher_background.xml` - Gradient background
- `app_icon_background.xml` - Circular icon background

**Styles**:
- `QuickActionButton` - Styled buttons for quick actions
- `Theme.HotelTVLauncher` - Leanback-optimized theme

## Build & Deploy

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK Platform 34
- Android TV emulator or physical device

### Building APK

1. **Open in Android Studio**
   ```
   File → Open → Select android-tv-launcher folder
   ```

2. **Sync Gradle**
   - Click "Sync Now" when prompted
   - Wait for dependencies to download

3. **Build Debug APK**
   ```
   Build → Build Bundle(s)/APK(s) → Build APK(s)
   ```
   Output: `app/build/outputs/apk/debug/app-debug.apk`

4. **Install via ADB**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Setting as Default Launcher

1. Install APK on Android TV
2. Press Home button on remote
3. Select "Hotel TV Launcher"
4. Choose "Always"

## Customization

### Change Default Apps

Edit `MainActivity.kt`:
```kotlin
val defaultApps = listOf(
    AppItem(id = 1, name = "Live TV", iconResId = R.drawable.ic_live_tv),
    AppItem(id = 2, name = "YouTube", iconResId = R.drawable.ic_youtube),
    // Add more apps
)
```

### Modify Colors

Edit `colors.xml`:
```xml
<color name="primary_color">#FF6B6B</color>
<color name="secondary_color">#4ECDC4</color>
```

### Update Branding

Branding is fetched from CMS dynamically:
- Logo URL
- Primary/Secondary colors
- Welcome message
- Hotel info

## API Integration Details

### tRPC Protocol

The app uses Retrofit to communicate with the CMS tRPC backend:

```kotlin
// Example tRPC call
val response = apiService.requestCode(PairingRequest(
    jsonrpc = "2.0",
    method = "pairing.requestCode",
    params = PairingParams(deviceId, deviceName)
))
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trpc/pairing.requestCode` | POST | Generate pairing code |
| `/api/trpc/pairing.checkStatus` | GET | Check if device is paired |
| `/api/trpc/hotels.getById` | GET | Get hotel configuration |
| `/api/trpc/tvApps.getByHotel` | GET | Get configured TV apps |
| `/api/trpc/publicApi.getWeather` | GET | Get weather data |

## Troubleshooting

### App Not Launching on Boot

Check manifest has correct intent filters:
```xml
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
    <category android:name="android.intent.category.HOME" />
</intent-filter>
```

### Network Connection Issues

Ensure CMS server is accessible:
- Same network as TV
- Firewall allows port 3000
- CORS configured in CMS

### Pairing Code Not Working

Verify:
- Device ID matches
- Code entered correctly in CMS
- Network connectivity
- CMS WebSocket connection active

## Next Steps

To complete implementation:

1. ✅ Create Kotlin source files
2. ✅ Create layout XMLs
3. ✅ Create resources (strings, colors, themes)
4. ✅ Create drawables
5. ⏳ Add launcher icons (ic_launcher.png, tv_banner.png)
6. ⏳ Implement full pairing logic
7. ⏳ Implement app launching (deep links/package names)
8. ⏳ Add WebSocket listener for real-time updates
9. ⏳ Test on physical Android TV device

## License

© 2024 Hotel TV System
