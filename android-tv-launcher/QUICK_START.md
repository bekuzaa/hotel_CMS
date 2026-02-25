# Quick Start Guide - Android TV Launcher

## 📦 Project Structure Created

```
android-tv-launcher/
├── app/src/main/
│   ├── java/com/hotel/tvlauncher/
│   │   ├── MainActivity.kt          ✅ Main launcher (290 lines)
│   │   ├── BootReceiver.kt          ✅ Auto-start on boot
│   │   ├── HotelApiService.kt       ✅ API interface (118 lines)
│   │   ├── AppAdapter.kt            ✅ RecyclerView adapter
│   │   ├── PairingManager.kt        ✅ Pairing logic (182 lines)
│   │   └── PreferencesManager.kt    ✅ Settings storage (90 lines)
│   ├── res/
│   │   ├── layout/
│   │   │   ├── activity_main.xml    ✅ Main UI (158 lines)
│   │   │   └── item_app.xml         ✅ App items (32 lines)
│   │   ├── values/
│   │   │   ├── strings.xml          ✅ Text resources
│   │   │   ├── colors.xml           ✅ Color definitions
│   │   │   └── themes.xml           ✅ App themes
│   │   └── drawable/
│   │       ├── launcher_background.xml  ✅ Gradient bg
│   │       ├── app_icon_background.xml  ✅ Icon circles
│   │       ├── ic_launcher.xml   ✅ App icon (vector)
│   │       └── tv_banner.xml     ✅ TV banner (vector)
│   └── AndroidManifest.xml          ✅ App manifest
├── build.gradle                     ✅ Build config
├── app/build.gradle                 ✅ Module config
└── settings.gradle                  ✅ Gradle settings
```

**Total:** 19 files created ✅

---

## 🚀 How to Build

### Step 1: Open in Android Studio

```
1. Launch Android Studio Hedgehog (2023.1.1) or later
2. File → Open → Select "android-tv-launcher" folder
3. Click "Open"
```

### Step 2: Sync Gradle

```
1. Wait for "Sync Now" prompt
2. Click it and wait for download to complete
3. Check bottom panel for "BUILD SUCCESSFUL"
```

### Step 3: Build APK

```
Menu: Build → Build Bundle(s)/APK(s) → Build APK(s)
Wait 1-2 minutes for first build
```

Output location:
```
app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Install on Android TV

**Option A: Via USB**
```
1. Copy APK to USB drive
2. Insert into TV
3. Use TV file manager to install
```

**Option B: Via ADB (Recommended)**
```bash
# Enable ADB debugging on TV:
Settings → Device Preferences → Security → Unknown Sources → ON
Settings → Device Preferences → About → Build → Click 7 times

# Connect via network or USB
adb connect 192.168.1.XXX:5555
adb install app-debug.apk
```

---

## ⚙️ Configuration

### Set as Default Home Launcher

After installation:

```
1. Press HOME button on remote
2. You'll see: "Complete action using"
3. Select "Hotel TV Launcher"
4. Choose "ALWAYS"
```

Now the app will launch automatically on TV boot!

### Initial Setup

**First Time Use:**

1. App shows device ID: `TV-XXXXX`
2. App automatically requests pairing code
3. Go to CMS → Devices page
4. Enter the pairing code shown on TV
5. Select room number
6. TV will show "✓ Paired - Room XXX"

**Change CMS URL:**

```
1. Press MENU button on remote
2. Enter password (default: 9988)
3. Select "Change CMS URL"
4. Enter your CMS server IP
   Example: http://192.168.1.100:3000
5. Press "Save"
```

**Change Password:**

```
1. Press MENU button
2. Enter current password
3. Select "Change Password"
4. Enter new password (min 4 digits)
5. Press "Save"
```

---

## 🎮 Remote Control Navigation

| Button | Action |
|--------|--------|
| **D-PAD Left/Right** | Navigate apps |
| **D-PAD Up** | Show quick actions |
| **D-PAD Down** | Navigate to bottom bar |
| **OK/Enter** | Select app/action |
| **MENU** | Open settings |
| **BACK** | Go back |
| **HOME** | Return to launcher |

---

## 📱 Features

### Main Screen

- **Top Bar:**
  - Hotel logo (left)
  - Welcome message (left)
  - Current time (right)
  - Date (right)
  - Weather (right)
  - Device ID & pairing status (right)

- **Center:**
  - Horizontal scrolling apps grid
  - Default apps: Live TV, YouTube, Netflix, Settings

- **Bottom Bar (Quick Actions):**
  - Room Service
  - Housekeeping
  - Wake-up
  - Hotel Info
  - Front Desk

### Settings Menu (Password Protected)

- Change CMS URL
- Change Password
- Reset Pairing
- About

---

## 🔧 Troubleshooting

### App Not Appearing on Home

**Problem:** App doesn't show when pressing HOME button

**Solution:**
```
1. Go to Settings → Apps
2. Find "Hotel TV Launcher"
3. Clear defaults
4. Press HOME again
5. Select Hotel TV Launcher → ALWAYS
```

### Pairing Code Not Working

**Problem:** TV shows "Pairing timeout"

**Solutions:**
1. Check CMS server is running: `http://your-ip:3000`
2. Verify same network connection
3. Check firewall allows port 3000
4. Restart pairing: MENU → Reset Pairing

### Network Connection Failed

**Problem:** "Network error" message

**Solutions:**
1. Verify CMS URL is correct
2. Test from TV browser: `http://your_cms_ip:3000`
3. Check WiFi/Ethernet connection
4. Restart TV network settings

---

## 📊 Technical Details

### Permissions Required

```xml
INTERNET - Connect to CMS server
RECEIVE_BOOT_COMPLETED - Auto-start on TV boot
ACCESS_NETWORK_STATE - Check network connectivity
```

### API Endpoints Used

```
POST /api/trpc/pairing.requestCode
GET  /api/trpc/pairing.checkStatus?deviceId=XXX
GET  /api/trpc/hotels.getById?id=XXX
GET  /api/trpc/tvApps.getByHotel?hotelId=XXX
GET  /api/trpc/publicApi.getWeather?hotelId=XXX
```

### Storage

```
Shared Preferences:
- cms_url: CMS server URL
- settings_password: Settings password
- is_paired: Pairing status
- hotel_id: Paired hotel ID
- room_number: Assigned room
- device_id: Unique device identifier
- pairing_code: Current pairing code
```

---

## 🎨 Customization

### Change Default Apps

Edit `MainActivity.kt`, function `loadTVApps()`:

```kotlin
appsList = listOf(
    AppItem(id = 1, name = "Live TV", iconResId = ...),
    AppItem(id = 2, name = "YouTube", iconResId = ...),
    // Add more apps
)
```

### Modify Colors

Edit `colors.xml`:

```xml
<color name="primary_color">#FF6B6B</color>
<color name="secondary_color">#4ECDC4</color>
```

### Update Welcome Message

Edit `strings.xml`:

```xml
<string name="welcome_message">YOUR CUSTOM MESSAGE</string>
```

---

## 📝 Next Steps

To fully deploy:

1. ✅ Build signed release APK
2. ✅ Test on physical Android TV device
3. ✅ Configure CMS server IP
4. ✅ Pair all TV devices in hotel
5. ✅ Customize branding per hotel
6. ✅ Set up auto-start on all TVs

---

## 🆘 Support

For issues or questions:
- Check IMPLEMENTATION_GUIDE.md for developer details
- Review logs: `adb logcat | grep HotelTV`
- CMS documentation: ANDROID_TV_INTEGRATION.md

---

**Version:** 1.0  
**Build:** Debug  
**Last Updated:** 2024
