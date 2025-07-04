const httpStatus = require('http-status');
const { Profile } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Check if profile name is taken for a user
 * @param {string} profileName - The profile name
 * @param {ObjectId} userId - The user's id
 * @param {ObjectId} [excludeProfileId] - The id of the profile to be excluded
 * @returns {Promise<boolean>}
 */
const isProfileNameTaken = async (profileName, userId, excludeProfileId) => {
  const profile = await Profile.findOne({
    profileName,
    userId,
    _id: { $ne: excludeProfileId },
  });
  return !!profile;
};

/**
 * Create a profile
 * @param {Object} profileBody
 * @returns {Promise<Profile>}
 */
const createProfile = async (profileBody) => {
  const isNameTaken = await isProfileNameTaken(profileBody.profileName, profileBody.userId);
  if (isNameTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Profile name already exists for this user');
  }

  // If this is the first profile, set it as default
  const existingProfiles = await Profile.find({ userId: profileBody.userId });
  const isFirstProfile = existingProfiles.length === 0;

  const profile = await Profile.create({
    ...profileBody,
    isDefault: isFirstProfile || profileBody.isDefault || false,
  });

  return profile;
};

/**
 * Query for profiles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProfiles = async (filter, options) => {
  const profiles = await Profile.paginate(filter, options);
  return profiles;
};

/**
 * Get profile by id
 * @param {ObjectId} id
 * @returns {Promise<Profile>}
 */
const getProfileById = async (id) => {
  return Profile.findById(id);
};

/**
 * Get profiles by user id
 * @param {ObjectId} userId
 * @returns {Promise<Profile[]>}
 */
const getProfilesByUserId = async (userId) => {
  return Profile.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
};

/**
 * Get user's default profile
 * @param {ObjectId} userId
 * @returns {Promise<Profile>}
 */
const getDefaultProfile = async (userId) => {
  return Profile.findOne({ userId, isDefault: true });
};

/**
 * Update profile by id
 * @param {ObjectId} profileId
 * @param {Object} updateBody
 * @returns {Promise<Profile>}
 */
const updateProfileById = async (profileId, updateBody) => {
  const profile = await getProfileById(profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  if (updateBody.profileName && (await isProfileNameTaken(updateBody.profileName, profile.userId, profileId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Profile name already exists for this user');
  }

  Object.assign(profile, updateBody);
  await profile.save();
  return profile;
};

/**
 * Set profile as default
 * @param {ObjectId} userId
 * @param {ObjectId} profileId
 * @returns {Promise<Profile>}
 */
const setDefaultProfile = async (userId, profileId) => {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  // Unset all other profiles as default
  await Profile.updateMany({ userId, _id: { $ne: profileId } }, { $set: { isDefault: false } });

  // Set the specified profile as default
  await Profile.findByIdAndUpdate(profileId, { $set: { isDefault: true } });

  return Profile.findById(profileId);
};

/**
 * Delete profile by id
 * @param {ObjectId} profileId
 * @returns {Promise<Profile>}
 */
const deleteProfileById = async (profileId) => {
  const profile = await getProfileById(profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  // If deleting default profile, set another profile as default
  if (profile.isDefault) {
    const otherProfile = await Profile.findOne({ userId: profile.userId, _id: { $ne: profileId } });
    if (otherProfile) {
      otherProfile.isDefault = true;
      await otherProfile.save();
    }
  }

  await Profile.deleteOne({ _id: profileId });
  return profile;
};

module.exports = {
  createProfile,
  queryProfiles,
  getProfileById,
  getProfilesByUserId,
  getDefaultProfile,
  updateProfileById,
  setDefaultProfile,
  deleteProfileById,
  isProfileNameTaken,
};
