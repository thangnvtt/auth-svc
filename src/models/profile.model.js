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

// Profile methods for creating content
profileSchema.methods.createPost = async function (postData) {
  const Post = require('./post.model');
  const postBody = { ...postData, profileId: this._id };
  return Post.create(postBody);
};

profileSchema.methods.createQuestion = async function (questionData) {
  const Question = require('./question.model');
  const questionBody = { ...questionData, profileId: this._id };
  return Question.create(questionBody);
};

// Profile methods for getting content
profileSchema.methods.getPosts = async function (options = {}) {
  const Post = require('./post.model');
  const filter = { profileId: this._id };
  return Post.paginate(filter, options);
};

profileSchema.methods.getQuestions = async function (options = {}) {
  const Question = require('./question.model');
  const filter = { profileId: this._id };
  return Question.paginate(filter, options);
};

// Profile methods for content statistics
profileSchema.methods.getContentStats = async function () {
  const Post = require('./post.model');
  const Question = require('./question.model');

  const [postStats, questionStats] = await Promise.all([
    Post.aggregate([
      { $match: { profileId: this._id } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalLikes: { $sum: '$likeCount' },
          totalSaves: { $sum: '$saveCount' },
          totalShares: { $sum: '$shareCount' },
        },
      },
    ]),
    Question.aggregate([
      { $match: { profileId: this._id } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          totalLikes: { $sum: '$likeCount' },
          totalSaves: { $sum: '$saveCount' },
          totalShares: { $sum: '$shareCount' },
        },
      },
    ]),
  ]);

  const postData = postStats[0] || {
    totalPosts: 0,
    totalLikes: 0,
    totalSaves: 0,
    totalShares: 0,
  };

  const questionData = questionStats[0] || {
    totalQuestions: 0,
    totalLikes: 0,
    totalSaves: 0,
    totalShares: 0,
  };

  return {
    posts: postData,
    questions: questionData,
    totalContent: postData.totalPosts + questionData.totalQuestions,
    totalEngagement:
      postData.totalLikes +
      postData.totalSaves +
      postData.totalShares +
      questionData.totalLikes +
      questionData.totalSaves +
      questionData.totalShares,
  };
};

/**
 * @typedef Profile
 */
const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
