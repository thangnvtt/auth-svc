const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const profileService = require('./profile.service');
const logger = require('../config/logger');
const { profileTypes, profileStatuses } = require('../config/profileEnums');

/**
 * Generate anonymous profile name with Neswa prefix and 6-digit random number
 * @returns {string}
 */
const generateAnonymousProfileName = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  return `Neswa${randomNumber}`;
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await User.isUsernameTaken(userBody.username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }

  const user = await User.create(userBody);

  // Create default profiles for the new user
  try {
    // Create public profile using user's name
    const publicProfile = await profileService.createProfile({
      userId: user._id,
      profileName: userBody.name,
      displayName: userBody.name,
      bio: '',
      profileType: profileTypes.PUBLIC,
      status: profileStatuses.PUBLIC,
      isDefault: true, // Set public profile as default
      isActive: true,
    });

    // Create anonymous profile with Neswa prefix
    const anonymousProfile = await profileService.createProfile({
      userId: user._id,
      profileName: generateAnonymousProfileName(),
      displayName: 'Anonymous User',
      bio: '',
      profileType: profileTypes.ANONYMOUS,
      status: profileStatuses.PRIVATE,
      isDefault: false,
      isActive: true,
    });

    logger.info(
      `Created profiles for user ${user.email}: public (${publicProfile.profileName}) and anonymous (${anonymousProfile.profileName})`
    );
  } catch (error) {
    // If profile creation fails, we should still return the user
    // but log the error for debugging
    logger.error('Failed to create default profiles for user:', error.message);
  }

  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Get user by username
 * @param {string} username
 * @returns {Promise<User>}
 */
const getUserByUsername = async (username) => {
  return User.findOne({ username });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  updateUserById,
  deleteUserById,
};
