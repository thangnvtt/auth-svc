const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { profileTypes, profileStatuses, profilePrivacySettings } = require('../config/profileEnums');

const createProfile = {
  body: Joi.object().keys({
    profileName: Joi.string().required().min(2).max(50),
    displayName: Joi.string().required().min(1).max(100),
    bio: Joi.string().allow('').max(500),
    avatar: Joi.string().uri().allow(''),
    profileType: Joi.string()
      .valid(...Object.values(profileTypes))
      .default(profileTypes.PUBLIC),
    status: Joi.string()
      .valid(...Object.values(profileStatuses))
      .default(profileStatuses.PUBLIC),
    isActive: Joi.boolean().default(true),
    isDefault: Joi.boolean().default(false),
    settings: Joi.object().keys({
      privacy: Joi.string()
        .valid(...Object.values(profilePrivacySettings))
        .default(profilePrivacySettings.PUBLIC),
      notifications: Joi.object().keys({
        email: Joi.boolean().default(true),
        push: Joi.boolean().default(true),
        sms: Joi.boolean().default(false),
      }),
    }),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()),
  }),
};

const getProfiles = {
  query: Joi.object().keys({
    profileType: Joi.string().valid(...Object.values(profileTypes)),
    status: Joi.string().valid(...Object.values(profileStatuses)),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getProfile = {
  params: Joi.object().keys({
    profileId: Joi.string().custom(objectId),
  }),
};

const updateProfile = {
  params: Joi.object().keys({
    profileId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      profileName: Joi.string().min(2).max(50),
      displayName: Joi.string().min(1).max(100),
      bio: Joi.string().allow('').max(500),
      avatar: Joi.string().uri().allow(''),
      profileType: Joi.string().valid(...Object.values(profileTypes)),
      status: Joi.string().valid(...Object.values(profileStatuses)),
      isActive: Joi.boolean(),
      isDefault: Joi.boolean(),
      settings: Joi.object().keys({
        privacy: Joi.string().valid(...Object.values(profilePrivacySettings)),
        notifications: Joi.object().keys({
          email: Joi.boolean(),
          push: Joi.boolean(),
          sms: Joi.boolean(),
        }),
      }),
      metadata: Joi.object().pattern(Joi.string(), Joi.any()),
    })
    .min(1),
};

const setDefaultProfile = {
  params: Joi.object().keys({
    profileId: Joi.string().custom(objectId),
  }),
};

const deleteProfile = {
  params: Joi.object().keys({
    profileId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createProfile,
  getProfiles,
  getProfile,
  updateProfile,
  setDefaultProfile,
  deleteProfile,
};
