# Multi-Profile User System

This feature allows users to have multiple account profiles, enabling them to manage different personas or contexts within a single account.

## Overview

The multi-profile system consists of:

- **Profile Model**: Stores profile information including name, display name, bio, avatar, type, settings, and metadata
- **Profile Service**: Handles business logic for profile operations
- **Profile Controller**: Manages HTTP requests and responses
- **Profile Routes**: Defines API endpoints for profile management
- **Profile Validation**: Validates input data for profile operations

## Features

### Profile Types

- **Personal**: For personal use
- **Business**: For business-related activities
- **Professional**: For professional networking
- **Creative**: For creative pursuits

### Profile Settings

- **Privacy**: public, private, friends
- **Notifications**: email, push, SMS preferences
- **Metadata**: Flexible key-value storage for additional data

### Key Features

1. **Multiple Profiles**: Users can create multiple profiles per account
2. **Default Profile**: One profile can be set as default
3. **Profile Switching**: Easy switching between profiles
4. **Privacy Controls**: Per-profile privacy settings
5. **Notification Preferences**: Individual notification settings per profile
6. **Flexible Metadata**: Store additional profile-specific data

## API Endpoints

### Create Profile

```
POST /v1/profiles
```

Creates a new profile for the authenticated user.

**Request Body:**

```json
{
  "profileName": "john_personal",
  "displayName": "John Doe",
  "bio": "Software developer and tech enthusiast",
  "profileType": "personal",
  "settings": {
    "privacy": "public",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  }
}
```

### Get User Profiles

```
GET /v1/profiles/user
```

Retrieves all profiles for the authenticated user.

### Get Default Profile

```
GET /v1/profiles/default
```

Retrieves the default profile for the authenticated user.

### Get Profile by ID

```
GET /v1/profiles/:profileId
```

Retrieves a specific profile by ID (only if it belongs to the authenticated user).

### Update Profile

```
PATCH /v1/profiles/:profileId
```

Updates a specific profile (only if it belongs to the authenticated user).

### Set Default Profile

```
PATCH /v1/profiles/:profileId/set-default
```

Sets a profile as the default profile for the user.

### Delete Profile

```
DELETE /v1/profiles/:profileId
```

Deletes a profile (cannot delete the only profile).

## Database Schema

### Profile Model

```javascript
{
  userId: ObjectId,           // Reference to User
  profileName: String,        // Unique per user
  displayName: String,        // Display name
  bio: String,               // Profile bio
  avatar: String,            // Avatar URL
  profileType: String,       // personal, business, professional, creative
  isActive: Boolean,         // Active status
  isDefault: Boolean,        // Default profile flag
  settings: {
    privacy: String,         // public, private, friends
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    }
  },
  metadata: Map,             // Flexible key-value storage
  createdAt: Date,
  updatedAt: Date
}
```

### User Model Updates

Added virtual `profiles` field to populate user's profiles when needed.

## Usage Examples

### Creating Multiple Profiles

```javascript
// Create personal profile
const personalProfile = await profileService.createProfile({
  userId: user._id,
  profileName: 'john_personal',
  displayName: 'John Doe',
  profileType: 'personal',
});

// Create business profile
const businessProfile = await profileService.createProfile({
  userId: user._id,
  profileName: 'john_business',
  displayName: 'John Doe - CEO',
  profileType: 'business',
});
```

### Switching Default Profile

```javascript
// Set business profile as default
await profileService.setDefaultProfile(user._id, businessProfile._id);
```

### Getting User's Profiles

```javascript
// Get all profiles for a user
const profiles = await user.getProfiles();

// Get default profile
const defaultProfile = await user.getDefaultProfile();
```

## Security Considerations

1. **Authorization**: Users can only manage their own profiles
2. **Profile Name Uniqueness**: Profile names must be unique per user
3. **Default Profile**: At least one profile must exist and be set as default
4. **Privacy Settings**: Profile privacy settings control visibility
5. **Input Validation**: All profile data is validated before saving

## Testing

The feature includes comprehensive tests:

- Unit tests for profile model methods
- Integration tests for profile endpoints
- Test fixtures for consistent test data

Run tests with:

```bash
npm test -- --testPathPattern=profile
```

## Future Enhancements

1. **Profile Templates**: Pre-defined profile templates for common use cases
2. **Profile Permissions**: Role-based permissions per profile
3. **Profile Analytics**: Usage analytics per profile
4. **Profile Backup**: Export/import profile data
5. **Profile Sharing**: Share profiles with other users
6. **Profile Verification**: Verification badges for profiles
7. **Profile Themes**: Custom themes per profile
8. **Profile Integration**: Third-party service integration per profile
