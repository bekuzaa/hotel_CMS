# Android TV Launcher - Testing Checklist

## Pre-Build Verification

### 1. Backend API Endpoints ✅
- [x] `/api/trpc/pairing.requestCode` - Exists in `server/routers/pairing.ts`
- [x] `/api/trpc/pairing.checkStatus` - Exists in `server/routers/pairing.ts`
- [x] `/api/trpc/hotels.getById` - Exists in `server/routers/hotels.ts`
- [x] `/api/trpc/tvApps.getByHotel` - Exists in `server/routers/tvApps.ts`
- [x] `/api/trpc/publicApi.getWeather` - Exists in `server/routers/publicApi.ts`

### 2. CMS Server Requirements
- [ ] CMS server running on accessible IP (e.g., `http://192.168.1.100:3000`)
- [ ] WebSocket server active for real-time updates
- [ ] Database initialized with hotels and tvApps tables
- [ ] At least one hotel created in CMS
- [ ] TV Apps configured for the hotel

---

## Build Process

### Step 1: Open Project
```
✓ Open Android Studio Hedgehog or later
✓ File → Open → Select android-tv-launcher folder
```

### Step 2: Sync Gradle
```
✓ Wait for Gradle sync to complete
✓ Verify no dependency errors
✓ Check all libraries downloaded successfully
```

### Step 3: Build APK
```
✓ Build → Build Bundle(s)/APK(s) → Build APK(s)
✓ Verify build successful
✓ APK location: app/build/outputs/apk/debug/app-debug.apk
```

**Expected Output:**
```
BUILD SUCCESSFUL in Xs XXms
```

---

## Installation & Setup

### Step 1: Enable ADB on Android TV
```
Settings → Device Preferences → Security → Unknown Sources → ON
Settings → Device Preferences → About → Build Number → Click 7 times
```

### Step 2: Connect via ADB
```bash
# Find TV IP address
adb connect 192.168.1.XXX:5555

# Install APK
adb install app-debug.apk

# Expected output: Success
```

### Step 3: Set as Default Launcher
```
1. Press HOME button on remote
2. Select "Hotel TV Launcher" from dialog
3. Choose "ALWAYS"
```

**Verification:**
- [ ] App launches automatically when pressing HOME
- [ ] App stays in foreground (doesn't crash)
- [ ] UI renders correctly (no black screen)

---

## Functional Testing

### Test 1: Initial Launch
- [ ] App displays gradient background
- [ ] Clock shows current time (format: HH:MM AM/PM)
- [ ] Date shows correctly
- [ ] Device ID displayed (format: TV-XXXXX)
- [ ] "Waiting for pairing..." message shown
- [ ] Weather shows default "28°C"

**Expected Behavior:**
```
Top Bar:
- Left: Placeholder for hotel logo + "WELCOME TO YOUR ROOM"
- Right: Time, Date, Weather, Device ID, Pairing Status

Center:
- Apps grid (4 default apps visible)

Bottom:
- Quick actions bar (5 buttons)
```

### Test 2: Device Pairing
**Steps:**
1. Note the device ID shown on TV (e.g., `TV-ABC123`)
2. Go to CMS → Devices page
3. Enter device ID or scan QR (if implemented)
4. Get pairing code from CMS
5. Wait for TV to show pairing code input

**CMS Side:**
- [ ] Device appears in Devices list
- [ ] Device name shows "Android TV - TV-XXXXX"
- [ ] Can generate pairing code
- [ ] Pairing code is 6 characters (alphanumeric)

**TV Side:**
- [ ] Shows "Enter code in CMS within 5 minutes"
- [ ] Pairing code displayed clearly
- [ ] Status changes to "Pairing..."

**After Entering Code in CMS:**
- [ ] TV shows "✓ Paired - Room XXX"
- [ ] Hotel logo loads (if configured)
- [ ] Welcome message appears
- [ ] Apps load from CMS configuration
- [ ] Weather updates (if API key configured)

### Test 3: Remote Control Navigation
**D-PAD Tests:**
- [ ] LEFT arrow moves selection left through apps
- [ ] RIGHT arrow moves selection right through apps
- [ ] UP arrow highlights quick actions bar
- [ ] DOWN arrow returns focus to apps
- [ ] Selected item has visual highlight/focus state

**OK/Enter Button:**
- [ ] Pressing OK on app launches it
- [ ] YouTube opens browser/YouTube app
- [ ] Settings opens settings dialog
- [ ] Toast messages appear briefly

**Menu Button:**
- [ ] Opens password dialog
- [ ] Dialog accepts 4-digit input
- [ ] Wrong password shows error toast
- [ ] Correct password opens settings menu

### Test 4: Settings Menu
**Access Test:**
```
Press MENU → Enter "9988" → Should open settings
```

**Change CMS URL:**
- [ ] Dialog shows current URL
- [ ] Can enter new URL (e.g., `http://192.168.1.200:3000`)
- [ ] Saves successfully
- [ ] Shows toast confirmation

**Change Password:**
- [ ] Can enter new 4+ digit password
- [ ] Rejects passwords < 4 digits
- [ ] Saves successfully
- [ ] Next login requires new password

**Reset Pairing:**
- [ ] Clears pairing data
- [ ] Shows "Requesting new code..." message
- [ ] Device ID remains same
- [ ] Starts new pairing request

**About:**
- [ ] Shows version info
- [ ] Shows copyright text

### Test 5: App Launching
**YouTube:**
- [ ] Opens YouTube TV interface
- [ ] Can navigate with remote
- [ ] BACK button returns to launcher

**Live TV (if configured):**
- [ ] Launches live TV app/stream
- [ ] Video plays correctly

**Settings:**
- [ ] Opens settings dialog
- [ ] All options accessible

### Test 6: Quick Actions Bar
**Room Service:**
- [ ] Button responds to click
- [ ] Shows "Coming soon" or opens ordering UI

**Housekeeping:**
- [ ] Button responds to click
- [ ] Shows service request UI

**Wake-up:**
- [ ] Opens wake-up call dialog
- [ ] Can set time
- [ ] Can confirm wake-up call

**Hotel Info:**
- [ ] Opens hotel information dialog
- [ ] Shows WiFi credentials
- [ ] Shows support contact

**Front Desk:**
- [ ] Shows contact options
- [ ] Can initiate call (if VoIP implemented)

### Test 7: Boot Auto-Start
**Test:**
```
1. Restart Android TV
2. Wait for boot completion
3. Observe if Hotel TV Launcher starts automatically
```

**Expected:**
- [ ] App launches within 30 seconds of boot
- [ ] No manual intervention needed
- [ ] Returns to paired state (doesn't reset)

---

## Integration Testing

### Test 8: CMS Real-Time Sync
**Changes from CMS:**
- [ ] Update hotel logo in CMS → TV reflects change
- [ ] Change welcome message → TV updates text
- [ ] Modify app order in CMS → TV reorders apps
- [ ] Add new TV app in CMS → New app appears on TV

**WebSocket Updates:**
- [ ] Service request from TV → CMS receives notification
- [ ] CMS marks request complete → TV shows update

### Test 9: Multi-Hotel Support
**Test Different Hotels:**
```
Hotel A:
- Logo: Hotel_A.png
- Primary Color: #FF6B6B
- Apps: [Live TV, YouTube, Netflix]

Hotel B:
- Logo: Hotel_B.png
- Primary Color: #4ECDC4
- Apps: [Live TV, YouTube, Disney+]
```

**Verification:**
- [ ] Pairing to Hotel A shows correct branding
- [ ] Reset pairing + pair to Hotel B shows different branding
- [ ] Apps match hotel configuration

### Test 10: Network Resilience
**Network Disconnection:**
- [ ] App continues showing cached data
- [ ] Shows offline indicator (if implemented)
- [ ] Reconnects automatically when network restored

**CMS Server Down:**
- [ ] App doesn't crash
- [ ] Shows connection error message
- [ ] Retries connection periodically

---

## Performance Testing

### Test 11: App Performance
- [ ] Cold start time < 3 seconds
- [ ] App switching is smooth (no lag)
- [ ] Remote control response is instant (< 100ms)
- [ ] No memory leaks after 1 hour of use
- [ ] No ANR (Application Not Responding) errors

### Test 12: Resource Usage
**Check via ADB:**
```bash
adb shell dumpsys meminfo com.hotel.tvlauncher
adb shell dumpsys cpuinfo | grep hotel.tvlauncher
```

**Expected:**
- Memory usage: < 200MB
- CPU usage: < 5% when idle
- No continuous background processes

---

## Security Testing

### Test 13: Password Protection
- [ ] Default password "9988" works
- [ ] Changed password persists after reboot
- [ ] Cannot bypass password dialog
- [ ] Password stored securely (not plain text)

### Test 14: Network Security
- [ ] App only connects to configured CMS URL
- [ ] No unauthorized data transmission
- [ ] Pairing codes expire after 5 minutes
- [ ] Device ID is unique per installation

---

## User Acceptance Testing (UAT)

### Scenario 1: Guest Experience
```
Guest enters room → TV turns on → Launcher displays
1. Welcome message visible
2. Easy to understand app icons
3. Can access room service easily
4. Can view hotel information
5. Can schedule wake-up call
```

**Feedback Points:**
- Is the UI intuitive?
- Are icons large enough to see from bed?
- Is navigation easy with remote?
- Can guests find services quickly?

### Scenario 2: Housekeeping Request
```
Guest presses "Housekeeping" → Selects service type → Confirms
1. Request sent to CMS
2. Housekeeping receives notification
3. Request marked complete in CMS
4. Guest sees status update
```

### Scenario 3: Check-out Process
```
Guest uses express checkout → Reviews bill → Confirms
1. Bill displays correctly
2. Payment processed (if integrated)
3. Checkout confirmation shown
4. CMS updates guest status
```

---

## Regression Testing

After any code changes, re-run:
- [ ] Test 1: Initial Launch
- [ ] Test 2: Device Pairing
- [ ] Test 3: Remote Control Navigation
- [ ] Test 4: Settings Menu
- [ ] Test 7: Boot Auto-Start

---

## Sign-off Criteria

Before production deployment, ensure:
- [ ] All functional tests pass
- [ ] Performance benchmarks met
- [ ] No critical bugs remaining
- [ ] UAT feedback incorporated
- [ ] Documentation complete
- [ ] Training materials prepared for hotel staff

---

## Troubleshooting Common Issues

### Issue 1: App Won't Install
```
Error: INSTALL_FAILED_UPDATE_INCOMPATIBLE
Solution: adb uninstall com.hotel.tvlauncher
```

### Issue 2: Not Setting as Default Launcher
```
Solution: Settings → Apps → Hotel TV Launcher → Open by default → Clear defaults
Then press HOME and select again
```

### Issue 3: Pairing Code Not Working
```
Checklist:
✓ Same network?
✓ CMS server running?
✓ Code entered correctly?
✓ Code not expired (> 5 min)?
✓ Device ID matches?
```

### Issue 4: Apps Not Loading
```
Checklist:
✓ Hotel configured in CMS?
✓ TV Apps added to hotel?
✓ Internet connection active?
✓ Check logs: adb logcat | grep HotelTV
```

---

## Test Report Template

```
Test Date: __________
Tester Name: __________
Build Version: 1.0
Device Model: __________
Android Version: __________

Results:
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

Critical Issues:
1. 
2. 
3. 

Recommendations:
□ Ready for production
□ Needs fixes before deployment
□ Requires additional testing

Sign-off: __________
```

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Testing
