# Hotel TV Launcher - Android TV Home Launcher

Native Android TV application that replaces the default TV home screen with a hotel-branded launcher interface.

## Features

✅ **Home Launcher**
- Replaces Android TV default home screen
- Auto-launches on TV boot
- Full remote control navigation support

✅ **CMS Integration**
- Device pairing with 6-digit code
- Real-time sync with CMS dashboard
- Fetch hotel branding (logo, colors, welcome message)
- Dynamic app configuration from CMS

✅ **Settings Protection**
- Password-protected settings menu
- Default password: `9988`
- Admin can change password via CMS

✅ **Hotel Services**
- Room service ordering
- Housekeeping requests
- Wake-up call scheduling
- Hotel information display
- Front desk contact

## Project Structure

```
android-tv-launcher/
├── app/
│   ├── src/main/
│   │   ├── java/com/hotel/tvlauncher/
│   │   │   ├── MainActivity.kt          # Main launcher UI & logic
│   │   │   ├── BootReceiver.kt          # Auto-start on boot
│   │   │   ├── HotelApiService.kt       # tRPC API interface
│   │   │   └── AppAdapter.kt            # Apps RecyclerView adapter
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   ├── activity_main.xml    # Main launcher layout
│   │   │   │   └── item_app.xml         # App grid item layout
│   │   │   ├── values/
│   │   │   │   ├── strings.xml
│   │   │   │   ├── colors.xml
│   │   │   │   └── themes.xml
│   │   │   └── drawable/
│   │   │       ├── launcher_background.xml
│   │   │       └── app_icon_background.xml
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## Build Instructions

### Requirements
- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34
- Minimum SDK 21 (Android TV 5.0)

### Steps

1. **Open Project**
   - Launch Android Studio
   - File → Open → Select `android-tv-launcher` folder

2. **Sync Gradle**
   - Wait for Gradle sync to complete
   - Download all dependencies

3. **Build APK**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK location: `app/build/outputs/apk/debug/app-debug.apk`

4. **Install on Android TV**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

## Configuration

### Set as Default Launcher

After installing on Android TV:
1. Press Home button on remote
2. Select "Hotel TV Launcher"
3. Choose "Always" when prompted

### Change CMS URL

1. Press Menu button on remote
2. Enter password (default: `9988`)
3. Select "Change CMS URL"
4. Enter your CMS server URL (e.g., `http://192.168.1.100:3000`)

### Change Settings Password

1. Press Menu button
2. Enter current password
3. Select "Change Password"
4. Enter new password

## API Integration

The app communicates with the CMS backend via tRPC:

- `/api/trpc/pairing.requestCode` - Generate pairing code
- `/api/trpc/pairing.checkStatus` - Check pairing status
- `/api/trpc/hotels.getById` - Get hotel branding
- `/api/trpc/tvApps.getByHotel` - Get configured apps
- `/api/trpc/publicApi.getWeather` - Get weather data

## Permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Leanback Support

The app is optimized for Android TV Leanback UI:
- D-pad navigation
- 10-foot UI
- Remote control friendly
- No touch required

## License

© 2024 Hotel TV System. All rights reserved.
