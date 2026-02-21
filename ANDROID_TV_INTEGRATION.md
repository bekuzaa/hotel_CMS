# Android TV App Integration Guide

## Overview

This guide provides instructions for integrating the Hotel TV System CMS with Android TV applications. The CMS exposes a public REST API that Android TV apps can use to fetch TV channels, menus, background images, guest information, and other data.

## Base API URL

```
https://your-domain.manus.space/api/trpc
```

## Authentication

The public API endpoints do not require authentication. All requests are made via HTTP GET or POST to the tRPC endpoints.

## API Endpoints for Android TV

### 1. Get TV Channels

**Endpoint**: `publicApi.getChannels`

**Method**: Query (GET)

**Parameters**:
- `language` (optional) - Language code: "en" or "th"

**Request**:
```bash
curl "https://your-domain.manus.space/api/trpc/publicApi.getChannels?input=%7B%22language%22:%22en%22%7D"
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Channel 1",
    "url": "https://example.com/stream1.m3u8",
    "imageUrl": "https://s3.example.com/channel1.jpg",
    "category": "Entertainment",
    "displayOrder": 1
  },
  {
    "id": 2,
    "name": "Channel 2",
    "url": "https://example.com/stream2.m3u8",
    "imageUrl": "https://s3.example.com/channel2.jpg",
    "category": "News",
    "displayOrder": 2
  }
]
```

### 2. Get Menu Items

**Endpoint**: `publicApi.getMenuItems`

**Method**: Query (GET)

**Parameters**:
- `language` (optional) - Language code: "en" or "th"

**Request**:
```bash
curl "https://your-domain.manus.space/api/trpc/publicApi.getMenuItems?input=%7B%22language%22:%22en%22%7D"
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Watch TV",
    "icon": "https://s3.example.com/icon-tv.png",
    "route": "tv",
    "displayOrder": 1
  },
  {
    "id": 2,
    "name": "Food & Dining",
    "icon": "https://s3.example.com/icon-food.png",
    "route": "food",
    "displayOrder": 2
  },
  {
    "id": 3,
    "name": "Hotel Guide",
    "icon": "https://s3.example.com/icon-guide.png",
    "route": "guide",
    "displayOrder": 3
  }
]
```

### 3. Get Background Images

**Endpoint**: `publicApi.getBackgroundImages`

**Method**: Query (GET)

**Request**:
```bash
curl "https://your-domain.manus.space/api/trpc/publicApi.getBackgroundImages?input=%7B%7D"
```

**Response**:
```json
{
  "displayMode": "slideshow",
  "displayDuration": 5,
  "images": [
    {
      "id": 1,
      "imageUrl": "https://s3.example.com/bg1.jpg",
      "displayOrder": 1
    },
    {
      "id": 2,
      "imageUrl": "https://s3.example.com/bg2.jpg",
      "displayOrder": 2
    }
  ]
}
```

### 4. Get Guest Information by Room

**Endpoint**: `publicApi.getGuestInfo`

**Method**: Query (GET)

**Parameters**:
- `roomId` (required) - Room ID

**Request**:
```bash
curl "https://your-domain.manus.space/api/trpc/publicApi.getGuestInfo?input=%7B%22roomId%22:101%7D"
```

**Response**:
```json
{
  "guestName": "John Doe",
  "checkInDate": "2026-02-14T14:00:00Z",
  "checkOutDate": "2026-02-16T11:00:00Z",
  "wifiPassword": "guest123",
  "welcomeMessage": "Welcome to our hotel!",
  "language": "en"
}
```

### 5. Get Hotel Information

**Endpoint**: `publicApi.getHotelInfo`

**Method**: Query (GET)

**Request**:
```bash
curl "https://your-domain.manus.space/api/trpc/publicApi.getHotelInfo?input=%7B%7D"
```

**Response**:
```json
{
  "hotelName": "Luxury Hotel",
  "wifiSSID": "LuxuryHotel-WiFi",
  "wifiPassword": "hotel123",
  "supportPhone": "+1-800-123-4567",
  "supportEmail": "support@hotel.com"
}
```

## Implementation Examples

### Android (Kotlin)

```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

interface HotelTVApi {
    @GET("publicApi.getChannels")
    suspend fun getChannels(@Query("input") input: String): List<Channel>
    
    @GET("publicApi.getMenuItems")
    suspend fun getMenuItems(@Query("input") input: String): List<MenuItem>
    
    @GET("publicApi.getBackgroundImages")
    suspend fun getBackgroundImages(@Query("input") input: String): BackgroundResponse
    
    @GET("publicApi.getGuestInfo")
    suspend fun getGuestInfo(@Query("input") input: String): GuestInfo
    
    @GET("publicApi.getHotelInfo")
    suspend fun getHotelInfo(@Query("input") input: String): HotelInfo
}

// Data classes
data class Channel(
    val id: Int,
    val name: String,
    val url: String,
    val imageUrl: String,
    val category: String,
    val displayOrder: Int
)

data class MenuItem(
    val id: Int,
    val name: String,
    val icon: String,
    val route: String,
    val displayOrder: Int
)

data class BackgroundResponse(
    val displayMode: String,
    val displayDuration: Int,
    val images: List<BackgroundImage>
)

data class BackgroundImage(
    val id: Int,
    val imageUrl: String,
    val displayOrder: Int
)

data class GuestInfo(
    val guestName: String,
    val checkInDate: String,
    val checkOutDate: String,
    val wifiPassword: String,
    val welcomeMessage: String,
    val language: String
)

data class HotelInfo(
    val hotelName: String,
    val wifiSSID: String,
    val wifiPassword: String,
    val supportPhone: String,
    val supportEmail: String
)

// Usage
val retrofit = Retrofit.Builder()
    .baseUrl("https://your-domain.manus.space/api/trpc/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()

val api = retrofit.create(HotelTVApi::class.java)

// Get channels
val channels = api.getChannels("{\"language\":\"en\"}")

// Get guest info for room 101
val guestInfo = api.getGuestInfo("{\"roomId\":101}")
```

### Android (Java)

```java
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.GET;
import retrofit2.http.Query;
import java.util.List;

public interface HotelTVApi {
    @GET("publicApi.getChannels")
    Call<List<Channel>> getChannels(@Query("input") String input);
    
    @GET("publicApi.getGuestInfo")
    Call<GuestInfo> getGuestInfo(@Query("input") String input);
}

// Usage
Retrofit retrofit = new Retrofit.Builder()
    .baseUrl("https://your-domain.manus.space/api/trpc/")
    .addConverterFactory(GsonConverterFactory.create())
    .build();

HotelTVApi api = retrofit.create(HotelTVApi.class);

api.getChannels("{\"language\":\"en\"}").enqueue(new Callback<List<Channel>>() {
    @Override
    public void onResponse(Call<List<Channel>> call, Response<List<Channel>> response) {
        List<Channel> channels = response.body();
        // Update UI with channels
    }

    @Override
    public void onFailure(Call<List<Channel>> call, Throwable t) {
        // Handle error
    }
});
```

## Real-time Sync (WebSocket)

For real-time updates, the Android TV app can connect to a WebSocket endpoint to receive notifications when data changes in the CMS.

**WebSocket URL**:
```
wss://your-domain.manus.space/api/ws
```

**Event Types**:
- `channel:updated` - Channel information changed
- `menu:updated` - Menu item changed
- `background:updated` - Background image changed
- `guest:updated` - Guest information changed
- `device:status` - Device status changed

**Example Event**:
```json
{
  "type": "channel:updated",
  "data": {
    "id": 1,
    "name": "Channel 1",
    "url": "https://example.com/stream1.m3u8"
  }
}
```

## Device Registration

To enable real-time sync and device status tracking, the Android TV app should register itself with the CMS:

**Endpoint**: `publicApi.registerDevice`

**Method**: Mutation (POST)

**Parameters**:
- `deviceId` (string, required) - Unique device identifier
- `roomId` (number, required) - Room number
- `deviceType` (string, optional) - Device type (e.g., "AndroidTV")
- `appVersion` (string, optional) - App version

**Request**:
```bash
curl -X POST "https://your-domain.manus.space/api/trpc/publicApi.registerDevice" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-123",
    "roomId": 101,
    "deviceType": "AndroidTV",
    "appVersion": "1.0.0"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Device registered successfully"
}
```

## Error Handling

All API responses follow a consistent error format:

**Error Response**:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid room ID"
  }
}
```

**Common Error Codes**:
- `BAD_REQUEST` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

## Best Practices

### 1. Caching

Cache API responses locally to reduce network requests:

```kotlin
// Cache channels for 1 hour
val cacheTime = 3600000 // 1 hour in milliseconds
val cachedChannels = loadChannelsFromCache()
if (System.currentTimeMillis() - cachedChannels.timestamp > cacheTime) {
    fetchChannelsFromAPI()
} else {
    displayChannels(cachedChannels.data)
}
```

### 2. Error Handling

Always handle network errors gracefully:

```kotlin
try {
    val channels = api.getChannels("{\"language\":\"en\"}")
    displayChannels(channels)
} catch (e: IOException) {
    // Network error - show cached data or error message
    showError("Network error: ${e.message}")
} catch (e: Exception) {
    // Other error
    showError("Error: ${e.message}")
}
```

### 3. Language Support

Always pass the user's preferred language:

```kotlin
val userLanguage = Locale.getDefault().language // "en" or "th"
val channels = api.getChannels("{\"language\":\"$userLanguage\"}")
```

### 4. Room Identification

Use a unique device ID to identify the TV device:

```kotlin
val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
api.registerDevice(deviceId, roomId, "AndroidTV", "1.0.0")
```

### 5. Retry Logic

Implement retry logic for failed requests:

```kotlin
suspend fun getChannelsWithRetry(maxRetries: Int = 3): List<Channel> {
    repeat(maxRetries) { attempt ->
        try {
            return api.getChannels("{\"language\":\"en\"}")
        } catch (e: Exception) {
            if (attempt == maxRetries - 1) throw e
            delay(1000 * (attempt + 1)) // Exponential backoff
        }
    }
    throw Exception("Failed to fetch channels")
}
```

## Testing

### Test Endpoints

For development and testing, you can use the following test endpoints:

```bash
# Test channel retrieval
curl "https://your-domain.manus.space/api/trpc/publicApi.getChannels?input=%7B%7D"

# Test guest info retrieval
curl "https://your-domain.manus.space/api/trpc/publicApi.getGuestInfo?input=%7B%22roomId%22:101%7D"

# Test hotel info retrieval
curl "https://your-domain.manus.space/api/trpc/publicApi.getHotelInfo?input=%7B%7D"
```

### Mock Data

For testing without a live CMS, you can create mock API responses:

```kotlin
class MockHotelTVApi : HotelTVApi {
    override suspend fun getChannels(input: String): List<Channel> {
        return listOf(
            Channel(1, "Channel 1", "https://example.com/stream1", "https://example.com/img1.jpg", "Entertainment", 1),
            Channel(2, "Channel 2", "https://example.com/stream2", "https://example.com/img2.jpg", "News", 2)
        )
    }
    
    override suspend fun getGuestInfo(input: String): GuestInfo {
        return GuestInfo(
            "John Doe",
            "2026-02-14T14:00:00Z",
            "2026-02-16T11:00:00Z",
            "guest123",
            "Welcome!",
            "en"
        )
    }
}
```

## Troubleshooting

### API Returns 404 Not Found

- Verify the API URL is correct
- Check that the endpoint name is spelled correctly
- Ensure the input JSON is properly formatted

### API Returns 500 Internal Server Error

- Check the CMS server logs
- Verify the database connection
- Restart the CMS server

### Real-time Updates Not Working

- Check WebSocket connection status
- Verify firewall allows WebSocket connections
- Check browser console for errors

## Support

For technical support or questions about the API integration, please contact:

- **Email**: support@hoteltv.example.com
- **Documentation**: See API_DOCUMENTATION.md for complete API reference
- **GitHub**: https://github.com/example/hotel-tv-system

## Version History

- **v1.0.0** (February 2026) - Initial release
