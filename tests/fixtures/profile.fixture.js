const mongoose = require('mongoose');
const faker = require('faker');
const Profile = require('../../src/models/profile.model');
const { profileTypes, profileStatuses, profilePrivacySettings } = require('../../src/config/profileEnums');

const profileOne = {
  _id: mongoose.Types.ObjectId(),
  userId: mongoose.Types.ObjectId(),
  profileName: 'john_personal',
  displayName: faker.name.findName(),
  bio: faker.lorem.sentence(),
  avatar: faker.internet.avatar(),
  profileType: profileTypes.PUBLIC,
  status: profileStatuses.PUBLIC,
  isActive: true,
  isDefault: true,
  settings: {
    privacy: profilePrivacySettings.PUBLIC,
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
  metadata: {},
};

const profileTwo = {
  _id: mongoose.Types.ObjectId(),
  userId: mongoose.Types.ObjectId(),
  profileName: 'john_business',
  displayName: faker.name.findName(),
  bio: faker.lorem.sentence(),
  avatar: faker.internet.avatar(),
  profileType: profileTypes.ANONYMOUS,
  status: profileStatuses.PRIVATE,
  isActive: true,
  isDefault: false,
  settings: {
    privacy: profilePrivacySettings.PRIVATE,
    notifications: {
      email: true,
      push: false,
      sms: true,
    },
  },
  metadata: {},
};

const profileThree = {
  _id: mongoose.Types.ObjectId(),
  userId: mongoose.Types.ObjectId(),
  profileName: 'jane_professional',
  displayName: faker.name.findName(),
  bio: faker.lorem.sentence(),
  avatar: faker.internet.avatar(),
  profileType: profileTypes.PUBLIC,
  status: profileStatuses.PUBLIC,
  isActive: true,
  isDefault: true,
  settings: {
    privacy: profilePrivacySettings.FRIENDS,
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
  metadata: {
    linkedin: 'https://linkedin.com/in/jane-doe',
    website: 'https://jane-doe.com',
  },
};

const insertProfiles = async (profiles) => {
  await Profile.insertMany(profiles);
};

module.exports = {
  profileOne,
  profileTwo,
  profileThree,
  insertProfiles,
};
