const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');
const { profileTypes, profileStatuses, profilePrivacySettings } = require('../config/profileEnums');

const profileSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileName: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length < 2) {
          throw new Error('Profile name must be at least 2 characters long');
        }
      },
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatar: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error('Avatar must be a valid URL');
        }
      },
    },
    profileType: {
      type: String,
      enum: Object.values(profileTypes),
      default: profileTypes.PUBLIC,
    },
    status: {
      type: String,
      enum: Object.values(profileStatuses),
      default: profileStatuses.PUBLIC,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    settings: {
      privacy: {
        type: String,
        enum: Object.values(profilePrivacySettings),
        default: profilePrivacySettings.PUBLIC,
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
profileSchema.plugin(toJSON);
profileSchema.plugin(paginate);

// Index for efficient queries
profileSchema.index({ userId: 1 });
profileSchema.index({ userId: 1, isDefault: 1 });
profileSchema.index({ userId: 1, profileName: 1 }, { unique: true });

// Pre-save middleware to ensure only one default profile per user
profileSchema.pre('save', async function (next) {
  const profile = this;

  if (profile.isModified('isDefault') && profile.isDefault) {
    // If setting this profile as default, unset all other profiles for this user
    await this.constructor.updateMany({ userId: profile.userId, _id: { $ne: profile._id } }, { $set: { isDefault: false } });
  }

  next();
});

// Pre-save middleware to ensure profile name is unique per user
profileSchema.pre('save', async function (next) {
  const profile = this;

  if (profile.isModified('profileName')) {
    // Check if profile name is taken directly in the model to avoid circular dependency
    const existingProfile = await this.constructor.findOne({
      profileName: profile.profileName,
      userId: profile.userId,
      _id: { $ne: profile._id },
    });

    if (existingProfile) {
      throw new Error('Profile name already exists for this user');
    }
  }

  next();
});

/**
 * @typedef Profile
 */
const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
