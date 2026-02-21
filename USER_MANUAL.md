# Hotel TV System - CMS User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing TV Channels](#managing-tv-channels)
4. [Managing Menus](#managing-menus)
5. [Managing Background Images](#managing-background-images)
6. [Managing Rooms](#managing-rooms)
7. [Managing Guest Information](#managing-guest-information)
8. [Media Gallery](#media-gallery)
9. [Settings](#settings)
10. [User Management](#user-management)
11. [Localization](#localization)
12. [Troubleshooting](#troubleshooting)

## Getting Started

### Login

1. Navigate to the Hotel TV System CMS URL
2. Click "Login with Manus"
3. Enter your credentials
4. You will be redirected to the dashboard

### Navigation

The CMS uses a sidebar navigation menu on the left side of the screen. Click any menu item to navigate to that section:

- **Dashboard** - Overview of system status and statistics
- **TV Channels** - Manage TV channels and streams
- **Menus** - Manage menu items displayed on TV apps
- **Background Images** - Manage home screen background images
- **Rooms** - Manage hotel rooms
- **Guest Info** - Manage guest information and WiFi credentials
- **Media Gallery** - Upload and manage media files
- **Settings** - System configuration and preferences
- **Users** - Manage CMS users and roles
- **Localization** - Manage multi-language support

## Dashboard Overview

The Dashboard provides a quick overview of your Hotel TV System:

### Key Metrics

- **Total Rooms** - Total number of rooms in the system
- **Active Rooms** - Number of rooms currently active
- **Total Guests** - Number of current guests
- **Total Channels** - Number of TV channels available
- **Total Menus** - Number of menu items
- **Online Devices** - Number of TV devices currently online
- **Offline Devices** - Number of TV devices currently offline

### Room Occupancy

Shows the current occupancy rate:
- **Occupied** - Number of occupied rooms
- **Vacant** - Number of vacant rooms
- **Occupancy Rate** - Percentage of occupied rooms

### Device Status

Shows the status of TV devices:
- **Online** - Devices currently connected
- **Offline** - Devices not connected
- **Idle** - Devices in idle state

### Recent Activity

Displays the latest actions performed in the system, including:
- User who performed the action
- Action type (create, update, delete)
- Entity affected
- Timestamp

## Managing TV Channels

### View TV Channels

1. Click **TV Channels** in the sidebar
2. You will see a list of all TV channels
3. Use pagination controls to navigate between pages

### Create a New Channel

1. Click the **Add Channel** button
2. Fill in the following information:
   - **Channel Name** - Name of the channel (required)
   - **Stream URL** - URL of the TV stream (required)
   - **Channel Image** - Upload or select an image for the channel
   - **Category** - Category of the channel (e.g., Entertainment, Sports)
   - **Display Order** - Order in which the channel appears on TV apps

3. Click **Save** to create the channel

### Edit a Channel

1. Click the **Edit** button next to the channel you want to modify
2. Update the channel information
3. Click **Save** to apply changes

### Delete a Channel

1. Click the **Delete** button next to the channel
2. Confirm the deletion
3. The channel will be removed from the system

### Reorder Channels

1. Click the **Reorder** button at the top of the channels list
2. Drag channels to rearrange them
3. Click **Save Order** to apply changes

## Managing Menus

### View Menus

1. Click **Menus** in the sidebar
2. You will see a list of all menu items

### Create a New Menu Item

1. Click the **Add Menu** button
2. Fill in the following information:
   - **Menu Name** - Name of the menu item (required)
   - **Icon** - Upload or select an icon image
   - **Route** - Navigation route or action
   - **Display Order** - Order in which the menu appears

3. Click **Save** to create the menu item

### Edit a Menu Item

1. Click the **Edit** button next to the menu item
2. Update the menu information
3. Click **Save** to apply changes

### Delete a Menu Item

1. Click the **Delete** button next to the menu item
2. Confirm the deletion
3. The menu item will be removed

### Reorder Menu Items

1. Click the **Reorder** button
2. Drag menu items to rearrange them
3. Click **Save Order** to apply changes

## Managing Background Images

### View Background Images

1. Click **Background Images** in the sidebar
2. You will see a grid of all background images

### Upload a Background Image

1. Click the **Upload Image** button
2. Select an image file from your computer
3. Choose the display mode:
   - **Single** - Display one image continuously
   - **Slideshow** - Rotate through multiple images
4. If using slideshow, set the display duration (in seconds)
5. Click **Upload** to save the image

### Set Display Mode

1. Click the **Settings** button on an image
2. Choose between **Single** or **Slideshow** mode
3. Set the display duration if using slideshow
4. Click **Save**

### Delete a Background Image

1. Click the **Delete** button on the image
2. Confirm the deletion
3. The image will be removed from the system

### Reorder Background Images

1. Click the **Reorder** button
2. Drag images to rearrange them
3. Click **Save Order** to apply changes

## Managing Rooms

### View Rooms

1. Click **Rooms** in the sidebar
2. You will see a list of all rooms
3. Use pagination to navigate between pages

### Create a New Room

1. Click the **Add Room** button
2. Fill in the following information:
   - **Room Number** - Room number (required)
   - **Room Type** - Type of room (e.g., Standard, Deluxe, Suite)
   - **Floor** - Floor number
3. Click **Save** to create the room

### Edit a Room

1. Click the **Edit** button next to the room
2. Update the room information
3. Click **Save** to apply changes

### Delete a Room

1. Click the **Delete** button next to the room
2. Confirm the deletion
3. The room will be removed from the system

### Bulk Import Rooms

To import multiple rooms at once:

1. Click the **Bulk Import** button
2. Download the CSV template
3. Fill in the room information in the CSV file:
   - Room Number
   - Room Type
   - Floor
4. Upload the CSV file
5. Click **Import** to add all rooms

**CSV Format Example**:
```
roomNumber,roomType,floor
101,Standard,1
102,Standard,1
103,Deluxe,1
201,Suite,2
```

### View Room Statistics

1. Click the **Statistics** button
2. You will see:
   - Total number of rooms
   - Number of active rooms
   - Number of occupied rooms

## Managing Guest Information

### View Guest Information

1. Click **Guest Info** in the sidebar
2. You will see a list of all guest information records

### Create Guest Information

1. Click the **Add Guest** button
2. Fill in the following information:
   - **Room Number** - Select the room (required)
   - **Guest Name** - Name of the guest (required)
   - **Check-in Date** - Date of check-in (required)
   - **Check-out Date** - Date of check-out (required)
   - **WiFi Password** - WiFi password for the guest
   - **Welcome Message** - Custom welcome message
   - **Language** - Preferred language (English or Thai)

3. Click **Save** to create the guest information

### Edit Guest Information

1. Click the **Edit** button next to the guest record
2. Update the guest information
3. Click **Save** to apply changes

### Delete Guest Information

1. Click the **Delete** button next to the guest record
2. Confirm the deletion
3. The guest information will be removed

### Bulk Import Guest Information

To import multiple guest records:

1. Click the **Bulk Import** button
2. Download the CSV template
3. Fill in the guest information in the CSV file
4. Upload the CSV file
5. Click **Import** to add all guest records

**CSV Format Example**:
```
roomId,guestName,checkInDate,checkOutDate,wifiPassword,welcomeMessage,language
101,John Doe,2026-02-14,2026-02-16,guest123,Welcome!,en
102,Jane Smith,2026-02-14,2026-02-17,guest456,Benvenuto!,en
```

## Media Gallery

### View Media Files

1. Click **Media Gallery** in the sidebar
2. You will see a grid of all uploaded media files

### Upload Media Files

1. Click the **Upload** button
2. Select one or more files from your computer
3. Supported formats: JPEG, PNG, GIF, WebP
4. Click **Upload** to save the files

### Download Media Files

1. Click on a media file to view it
2. Click the **Download** button to save it to your computer

### Delete Media Files

1. Click the **Delete** button on the media file
2. Confirm the deletion
3. The file will be removed from the system

### Copy Media URL

1. Click on a media file
2. Click the **Copy URL** button
3. The file URL will be copied to your clipboard
4. Use this URL in your channel or menu configurations

## Settings

### System Configuration

1. Click **Settings** in the sidebar
2. Update the following settings:
   - **Hotel Name** - Name of your hotel
   - **Support Phone** - Support phone number
   - **Support Email** - Support email address
   - **WiFi SSID** - Default WiFi network name
   - **WiFi Password** - Default WiFi password

3. Click **Save** to apply changes

### System Status

View the current status of:
- Database connection
- API server
- Storage service
- System uptime

## User Management

### View Users

1. Click **Users** in the sidebar
2. You will see a list of all CMS users

### Create a New User

1. Click the **Add User** button
2. Fill in the following information:
   - **Email** - User email address (required)
   - **Name** - User full name
   - **Role** - User role:
     - **Admin** - Full access to all features
     - **Manager** - Can manage most features
     - **Staff** - Limited access to guest info and media
     - **User** - Read-only access

3. Click **Save** to create the user

### Edit a User

1. Click the **Edit** button next to the user
2. Update the user information
3. Click **Save** to apply changes

### Delete a User

1. Click the **Delete** button next to the user
2. Confirm the deletion
3. The user will be removed from the system

### User Roles and Permissions

| Role | TV Channels | Menus | Background | Rooms | Guest Info | Media | Settings | Users |
|------|-------------|-------|------------|-------|-----------|-------|----------|-------|
| Admin | Full | Full | Full | Full | Full | Full | Full | Full |
| Manager | Full | Full | Full | Full | Full | Full | Read | Read |
| Staff | Read | Read | Read | Read | Full | Full | - | - |
| User | Read | Read | Read | Read | Read | Read | - | - |

## Localization

### Manage Language Settings

1. Click **Localization** in the sidebar
2. You will see translation keys for supported languages:
   - **English** - English translations
   - **Thai** - Thai translations

### Add or Edit Translations

1. Click the **Edit** button for a language
2. Update the translation values
3. Click **Save** to apply changes

### Supported Languages

- **English** (en)
- **Thai** (th)

### Translation Keys

Common translation keys include:
- `app.title` - Application title
- `menu.channels` - Channels menu label
- `menu.menus` - Menus menu label
- `button.save` - Save button label
- `button.delete` - Delete button label
- `message.success` - Success message
- `message.error` - Error message

## Troubleshooting

### I can't log in

1. Check that you have entered the correct email address
2. Verify that your account has been created by an admin
3. Clear your browser cache and cookies
4. Try using a different browser

### Changes are not appearing on TV devices

1. Check that the TV devices are online (see Dashboard)
2. Wait a few seconds for the sync to complete
3. Restart the TV app on the device
4. Check the Activity Logs to verify the changes were saved

### Media files are not uploading

1. Check the file size (maximum 50MB)
2. Verify the file format is supported (JPEG, PNG, GIF, WebP)
3. Check your internet connection
4. Try uploading a different file

### I can't access a feature

1. Check your user role and permissions
2. Contact an admin to request additional permissions
3. Log out and log back in

### The system is running slowly

1. Check the System Status in Settings
2. Reduce the number of background images in slideshow mode
3. Clear old activity logs
4. Contact support if the issue persists

## Support

For additional support or questions, please contact:

- **Email**: support@hoteltv.example.com
- **Phone**: +1-800-123-4567
- **Documentation**: See API_DOCUMENTATION.md for technical details

## Version Information

- **Version**: 1.0.0
- **Last Updated**: February 2026
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
