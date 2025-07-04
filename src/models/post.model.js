const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const postSchema = mongoose.Schema(
  {
    profileId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Profile',
      required: true,
    },
    categoryId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Category',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Engagement metrics
    likeCount: {
      type: Number,
      default: 0,
    },
    unlikeCount: {
      type: Number,
      default: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    // Arrays to track who liked/saved/shared
    likedBy: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Profile',
      },
    ],
    dislikedBy: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Profile',
      },
    ],
    savedBy: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Profile',
      },
    ],
    sharedBy: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Profile',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to json
postSchema.plugin(toJSON);
postSchema.plugin(paginate);

// Virtual for engagement score (for sorting by popularity)
postSchema.virtual('engagementScore').get(function () {
  return this.likeCount + this.saveCount + this.shareCount;
});

// Methods to handle engagement
postSchema.methods.addLike = function (profileId) {
  if (!this.likedBy.includes(profileId)) {
    this.likedBy.push(profileId);
    this.likeCount += 1;

    // Remove from disliked if exists
    const dislikeIndex = this.dislikedBy.indexOf(profileId);
    if (dislikeIndex !== -1) {
      this.dislikedBy.splice(dislikeIndex, 1);
      this.unlikeCount -= 1;
    }
  }
  return this.save();
};

postSchema.methods.removeLike = function (profileId) {
  const index = this.likedBy.indexOf(profileId);
  if (index !== -1) {
    this.likedBy.splice(index, 1);
    this.likeCount -= 1;
  }
  return this.save();
};

postSchema.methods.addDislike = function (profileId) {
  if (!this.dislikedBy.includes(profileId)) {
    this.dislikedBy.push(profileId);
    this.unlikeCount += 1;

    // Remove from liked if exists
    const likeIndex = this.likedBy.indexOf(profileId);
    if (likeIndex !== -1) {
      this.likedBy.splice(likeIndex, 1);
      this.likeCount -= 1;
    }
  }
  return this.save();
};

postSchema.methods.removeDislike = function (profileId) {
  const index = this.dislikedBy.indexOf(profileId);
  if (index !== -1) {
    this.dislikedBy.splice(index, 1);
    this.unlikeCount -= 1;
  }
  return this.save();
};

postSchema.methods.addSave = function (profileId) {
  if (!this.savedBy.includes(profileId)) {
    this.savedBy.push(profileId);
    this.saveCount += 1;
  }
  return this.save();
};

postSchema.methods.removeSave = function (profileId) {
  const index = this.savedBy.indexOf(profileId);
  if (index !== -1) {
    this.savedBy.splice(index, 1);
    this.saveCount -= 1;
  }
  return this.save();
};

postSchema.methods.addShare = function (profileId) {
  if (!this.sharedBy.includes(profileId)) {
    this.sharedBy.push(profileId);
    this.shareCount += 1;
  }
  return this.save();
};

// Index for better performance
postSchema.index({ profileId: 1, createdAt: -1 });
postSchema.index({ categoryId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likeCount: -1 });
postSchema.index({ createdAt: -1 });

/**
 * @typedef Post
 */
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
