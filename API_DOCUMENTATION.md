# Hotel TV System - API Documentation

## Overview

Hotel TV System provides a comprehensive REST API built with tRPC for managing TV channels, menus, background images, rooms, and guest information. The API supports both CMS operations and Android TV app integration.

## Base URL

```
https://your-domain.manus.space/api/trpc
```

## Authentication

All protected endpoints require authentication via JWT token in the session cookie. Public endpoints do not require authentication.

### Authentication Flow

1. User logs in via Manus OAuth
2. Session cookie is automatically set
3. All subsequent requests include the session cookie
4. Server validates the session and injects user context

## API Endpoints

### TV Channels Management

#### List TV Channels
- **Endpoint**: `tvChannels.getAll`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `limit` (number, default: 50) - Number of channels to return
  - `offset` (number, default: 0) - Pagination offset
  - `isActive` (boolean, optional) - Filter by active status

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Channel 1",
      "url": "https://example.com/stream",
      "imageUrl": "https://s3.example.com/image.jpg",
      "category": "Entertainment",
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2026-02-14T10:00:00Z"
    }
  ],
  "total": 10
}
```

#### Get Channel by ID
- **Endpoint**: `tvChannels.getById`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `id` (number, required) - Channel ID

#### Create Channel
- **Endpoint**: `tvChannels.create`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `name` (string, required) - Channel name
  - `url` (string, required) - Stream URL
  - `imageUrl` (string, optional) - Channel image URL
  - `category` (string, optional) - Channel category
  - `displayOrder` (number, optional) - Display order

#### Update Channel
- **Endpoint**: `tvChannels.update`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `id` (number, required) - Channel ID
  - `name` (string, optional) - Channel name
  - `url` (string, optional) - Stream URL
  - `imageUrl` (string, optional) - Channel image URL
  - `category` (string, optional) - Channel category
  - `isActive` (boolean, optional) - Active status

#### Delete Channel
- **Endpoint**: `tvChannels.delete`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `id` (number, required) - Channel ID

#### Reorder Channels
- **Endpoint**: `tvChannels.reorder`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `channelIds` (number[], required) - Array of channel IDs in new order

### Rooms Management

#### List Rooms
- **Endpoint**: `rooms.getAll`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `limit` (number, default: 50) - Number of rooms to return
  - `offset` (number, default: 0) - Pagination offset
  - `isActive` (boolean, optional) - Filter by active status

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "roomNumber": "101",
      "roomType": "Standard",
      "floor": 1,
      "isActive": true,
      "createdAt": "2026-02-14T10:00:00Z"
    }
  ],
  "total": 100
}
```

#### Get Room by ID
- **Endpoint**: `rooms.getById`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `id` (number, required) - Room ID

#### Create Room
- **Endpoint**: `rooms.create`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `roomNumber` (string, required) - Room number
  - `roomType` (string, optional) - Room type
  - `floor` (number, optional) - Floor number

#### Update Room
- **Endpoint**: `rooms.update`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `id` (number, required) - Room ID
  - `roomNumber` (string, optional) - Room number
  - `roomType` (string, optional) - Room type
  - `floor` (number, optional) - Floor number
  - `isActive` (boolean, optional) - Active status

#### Delete Room
- **Endpoint**: `rooms.delete`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `id` (number, required) - Room ID

#### Bulk Import Rooms
- **Endpoint**: `rooms.bulkImport`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `rooms` (array, required) - Array of room objects with roomNumber, roomType, floor

#### Get Room Statistics
- **Endpoint**: `rooms.getStats`
- **Method**: Query
- **Authentication**: Protected
- **Response**:
```json
{
  "totalRooms": 100,
  "activeRooms": 95,
  "occupiedRooms": 78
}
```

### Menu Items Management

#### List Menu Items
- **Endpoint**: `menuItems.getAll`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `limit` (number, default: 50) - Number of items to return
  - `offset` (number, default: 0) - Pagination offset

#### Create Menu Item
- **Endpoint**: `menuItems.create`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `name` (string, required) - Menu item name
  - `icon` (string, optional) - Icon URL
  - `route` (string, optional) - Navigation route
  - `displayOrder` (number, optional) - Display order

#### Update Menu Item
- **Endpoint**: `menuItems.update`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `id` (number, required) - Menu item ID
  - `name` (string, optional) - Menu item name
  - `icon` (string, optional) - Icon URL
  - `route` (string, optional) - Navigation route
  - `isActive` (boolean, optional) - Active status

#### Delete Menu Item
- **Endpoint**: `menuItems.delete`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `id` (number, required) - Menu item ID

### Background Images Management

#### List Background Images
- **Endpoint**: `backgroundImages.getAll`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `limit` (number, default: 50) - Number of images to return
  - `offset` (number, default: 0) - Pagination offset

#### Create Background Image
- **Endpoint**: `backgroundImages.create`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `imageUrl` (string, required) - Image URL
  - `displayMode` (string, required) - "single" or "slideshow"
  - `displayDuration` (number, optional) - Duration in seconds (for slideshow)
  - `displayOrder` (number, optional) - Display order

#### Update Background Image
- **Endpoint**: `backgroundImages.update`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `id` (number, required) - Image ID
  - `imageUrl` (string, optional) - Image URL
  - `displayMode` (string, optional) - Display mode
  - `displayDuration` (number, optional) - Display duration
  - `isActive` (boolean, optional) - Active status

#### Delete Background Image
- **Endpoint**: `backgroundImages.delete`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `id` (number, required) - Image ID

### Guest Information Management

#### List Guest Information
- **Endpoint**: `guestInfo.getAll`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `limit` (number, default: 50) - Number of records to return
  - `offset` (number, default: 0) - Pagination offset

#### Get Guest Info by Room ID
- **Endpoint**: `guestInfo.getByRoomId`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `roomId` (number, required) - Room ID

**Response**:
```json
{
  "id": 1,
  "roomId": 101,
  "guestName": "John Doe",
  "checkInDate": "2026-02-14T14:00:00Z",
  "checkOutDate": "2026-02-16T11:00:00Z",
  "wifiPassword": "guest123",
  "welcomeMessage": "Welcome to our hotel!",
  "language": "en"
}
```

#### Create Guest Information
- **Endpoint**: `guestInfo.create`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager/staff only)
- **Parameters**:
  - `roomId` (number, required) - Room ID
  - `guestName` (string, required) - Guest name
  - `checkInDate` (date, required) - Check-in date
  - `checkOutDate` (date, required) - Check-out date
  - `wifiPassword` (string, optional) - WiFi password
  - `welcomeMessage` (string, optional) - Welcome message
  - `language` (string, optional) - Language preference

#### Update Guest Information
- **Endpoint**: `guestInfo.update`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager/staff only)
- **Parameters**:
  - `id` (number, required) - Guest info ID
  - `guestName` (string, optional) - Guest name
  - `checkInDate` (date, optional) - Check-in date
  - `checkOutDate` (date, optional) - Check-out date
  - `wifiPassword` (string, optional) - WiFi password
  - `welcomeMessage` (string, optional) - Welcome message

#### Delete Guest Information
- **Endpoint**: `guestInfo.delete`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `id` (number, required) - Guest info ID

### Media Upload

#### Upload Media File
- **Endpoint**: `mediaUpload.upload`
- **Method**: Mutation
- **Authentication**: Protected (admin/manager only)
- **Parameters**:
  - `file` (File, required) - File to upload
  - `fileName` (string, required) - File name
  - `fileType` (string, required) - File type (image/jpeg, image/png, etc.)

**Response**:
```json
{
  "url": "https://s3.example.com/media/file-123.jpg",
  "fileName": "file-123.jpg",
  "fileSize": 2048,
  "uploadedAt": "2026-02-14T10:00:00Z"
}
```

#### Delete Media File
- **Endpoint**: `mediaUpload.delete`
- **Method**: Mutation
- **Authentication**: Protected (admin only)
- **Parameters**:
  - `fileKey` (string, required) - File key/path

### Analytics

#### Get Dashboard Statistics
- **Endpoint**: `analytics.getDashboardStats`
- **Method**: Query
- **Authentication**: Public
- **Response**:
```json
{
  "totalRooms": 100,
  "activeRooms": 95,
  "totalGuests": 78,
  "totalChannels": 25,
  "totalMenus": 8,
  "onlineDevices": 90,
  "offlineDevices": 5
}
```

#### Get Room Occupancy
- **Endpoint**: `analytics.getRoomOccupancy`
- **Method**: Query
- **Authentication**: Public
- **Response**:
```json
{
  "occupied": 78,
  "vacant": 17,
  "maintenance": 5,
  "occupancyRate": 78
}
```

#### Get Device Status
- **Endpoint**: `analytics.getDeviceStatus`
- **Method**: Query
- **Authentication**: Public
- **Response**:
```json
{
  "online": 90,
  "offline": 5,
  "idle": 5
}
```

#### Get System Health
- **Endpoint**: `analytics.getSystemHealth`
- **Method**: Query
- **Authentication**: Public
- **Response**:
```json
{
  "database": "healthy",
  "api": "healthy",
  "storage": "healthy",
  "uptime": 3600,
  "timestamp": "2026-02-14T10:00:00Z"
}
```

### Activity Logs

#### Get All Activity Logs
- **Endpoint**: `activityLogs.getAll`
- **Method**: Query
- **Authentication**: Protected
- **Parameters**:
  - `limit` (number, default: 50) - Number of logs to return
  - `offset` (number, default: 0) - Pagination offset
  - `userId` (number, optional) - Filter by user ID
  - `entityType` (string, optional) - Filter by entity type
  - `action` (string, optional) - Filter by action

#### Get Recent Activities
- **Endpoint**: `activityLogs.getRecentActivities`
- **Method**: Query
- **Authentication**: Public
- **Parameters**:
  - `limit` (number, default: 20) - Number of activities to return

#### Get Activity Statistics
- **Endpoint**: `activityLogs.getStatistics`
- **Method**: Query
- **Authentication**: Protected
- **Response**:
```json
{
  "totalActivities": 1000,
  "activitiesLast24h": 150,
  "uniqueUsers": 5,
  "topActions": [
    { "action": "create", "count": 450 },
    { "action": "update", "count": 300 }
  ],
  "topEntities": [
    { "entityType": "tvChannel", "count": 600 },
    { "entityType": "room", "count": 400 }
  ]
}
```

### Public API (For Android TV App)

#### Get All TV Channels
- **Endpoint**: `publicApi.getChannels`
- **Method**: Query
- **Authentication**: Public
- **Parameters**:
  - `language` (string, optional) - Language code (en, th)

#### Get All Menu Items
- **Endpoint**: `publicApi.getMenuItems`
- **Method**: Query
- **Authentication**: Public
- **Parameters**:
  - `language` (string, optional) - Language code

#### Get Background Images
- **Endpoint**: `publicApi.getBackgroundImages`
- **Method**: Query
- **Authentication**: Public

#### Get Guest Information by Room
- **Endpoint**: `publicApi.getGuestInfo`
- **Method**: Query
- **Authentication**: Public
- **Parameters**:
  - `roomId` (number, required) - Room ID

#### Get Hotel Information
- **Endpoint**: `publicApi.getHotelInfo`
- **Method**: Query
- **Authentication**: Public
- **Response**:
```json
{
  "hotelName": "Hotel Name",
  "wifiSSID": "HotelWiFi",
  "wifiPassword": "password123",
  "supportPhone": "+1-800-123-4567",
  "supportEmail": "support@hotel.com"
}
```

## Error Handling

All API responses follow the tRPC error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User is not authenticated"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - User is not authenticated
- `FORBIDDEN` - User does not have permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid request parameters
- `INTERNAL_SERVER_ERROR` - Server error

## Rate Limiting

Currently, no rate limiting is enforced. This may be added in future versions.

## Pagination

List endpoints support pagination with `limit` and `offset` parameters:

```
?limit=50&offset=0
```

## Localization

Supported languages:
- `en` - English
- `th` - Thai

Pass the `language` parameter to get localized responses where applicable.

## WebSocket Events (Real-time Sync)

Real-time sync is available via WebSocket connections. Events include:

- `channel:updated` - Channel information changed
- `menu:updated` - Menu item changed
- `background:updated` - Background image changed
- `guest:updated` - Guest information changed
- `device:status` - Device status changed

## Examples

### Using tRPC Client (React)

```typescript
import { trpc } from "@/lib/trpc";

// Get all TV channels
const { data: channels } = trpc.tvChannels.getAll.useQuery({
  limit: 50,
  offset: 0,
});

// Create a new channel
const createChannel = trpc.tvChannels.create.useMutation();
await createChannel.mutateAsync({
  name: "New Channel",
  url: "https://example.com/stream",
});

// Get dashboard statistics
const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
```

### Using REST API (Android TV App)

```bash
# Get all channels
curl -X GET "https://your-domain.manus.space/api/trpc/publicApi.getChannels?input=%7B%7D"

# Get guest info for room 101
curl -X GET "https://your-domain.manus.space/api/trpc/publicApi.getGuestInfo?input=%7B%22roomId%22:101%7D"
```

## Support

For API support and questions, please contact the development team or refer to the User Manual.
