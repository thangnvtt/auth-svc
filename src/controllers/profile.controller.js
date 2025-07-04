const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { profileService } = require('../services');

const createProfile = catchAsync(async (req, res) => {
  const profileBody = { ...req.body, userId: req.user.id };
  const profile = await profileService.createProfile(profileBody);
  res.status(httpStatus.CREATED).send(profile);
});

const getProfiles = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['profileType', 'status', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Only allow users to see their own profiles
  filter.userId = req.user.id;

  const result = await profileService.queryProfiles(filter, options);
  res.send(result);
});

const getProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getProfileById(req.params.profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  // Check if the profile belongs to the authenticated user
  if (profile.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  res.send(profile);
});

const getUserProfiles = catchAsync(async (req, res) => {
  const profiles = await profileService.getProfilesByUserId(req.user.id);
  res.send(profiles);
});

const getDefaultProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getDefaultProfile(req.user.id);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No default profile found');
  }
  res.send(profile);
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getProfileById(req.params.profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  // Check if the profile belongs to the authenticated user
  if (profile.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const updatedProfile = await profileService.updateProfileById(req.params.profileId, req.body);
  res.send(updatedProfile);
});

const setDefaultProfile = catchAsync(async (req, res) => {
  const profile = await profileService.setDefaultProfile(req.user.id, req.params.profileId);
  res.send(profile);
});

const deleteProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getProfileById(req.params.profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  // Check if the profile belongs to the authenticated user
  if (profile.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Check if this is the only profile
  const userProfiles = await profileService.getProfilesByUserId(req.user.id);
  if (userProfiles.length === 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete the only profile');
  }

  await profileService.deleteProfileById(req.params.profileId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProfile,
  getProfiles,
  getProfile,
  getUserProfiles,
  getDefaultProfile,
  updateProfile,
  setDefaultProfile,
  deleteProfile,
};
