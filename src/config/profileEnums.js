/**
 * Profile Type Enum
 */
const profileTypes = {
  PUBLIC: 'public',
  ANONYMOUS: 'anonymous',
};

/**
 * Profile Status Enum
 */
const profileStatuses = {
  PRIVATE: 'private',
  PUBLIC: 'public',
};

/**
 * Profile Privacy Settings Enum
 */
const profilePrivacySettings = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FRIENDS: 'friends',
};

/**
 * Profile Notification Types Enum
 */
const profileNotificationTypes = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
};

module.exports = {
  profileTypes,
  profileStatuses,
  profilePrivacySettings,
  profileNotificationTypes,
};
