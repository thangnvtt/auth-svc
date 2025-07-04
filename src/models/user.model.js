const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (value.length < 3) {
          throw new Error('Username must be at least 3 characters long');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          throw new Error('Username can only contain letters, numbers, and underscores');
        }
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length < 3) {
          throw new Error('Full name must be at least 3 characters long');
        }
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isMobilePhone(value, 'any', { strictMode: false })) {
          // For testing, allow basic phone number format
          if (!/^\+?[\d\s\-()]{10,15}$/.test(value)) {
            throw new Error('Invalid phone number');
          }
        }
      },
    },
    birthdate: {
      type: Date,
      required: true,
      validate(value) {
        if (value > new Date()) {
          throw new Error('Birthdate cannot be in the future');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Virtual field for profiles - will be populated when needed
    profiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if username is taken
 * @param {string} username - The user's username
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

/**
 * Get user's profiles
 * @returns {Promise<Profile[]>}
 */
userSchema.methods.getProfiles = async function () {
  const Profile = mongoose.model('Profile');
  return Profile.find({ userId: this._id }).sort({ isDefault: -1, createdAt: 1 });
};

/**
 * Get user's default profile
 * @returns {Promise<Profile>}
 */
userSchema.methods.getDefaultProfile = async function () {
  const Profile = mongoose.model('Profile');
  return Profile.findOne({ userId: this._id, isDefault: true });
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
