const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Profile } = require('../../src/models');
const { userOne, userTwo, insertUsers } = require('../fixtures/user.fixture');
const { profileOne, profileTwo, insertProfiles } = require('../fixtures/profile.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('Profile routes', () => {
  describe('POST /v1/profiles', () => {
    let newProfile;

    beforeEach(() => {
      newProfile = {
        profileName: faker.internet.userName(),
        displayName: faker.name.findName(),
        bio: faker.lorem.sentence(),
        profileType: 'public',
        status: 'public',
        settings: {
          privacy: 'public',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
      };
    });

    test('should return 201 and successfully create new profile if data is ok', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/profiles')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newProfile)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        userId: userOne._id.toHexString(),
        profileName: newProfile.profileName,
        displayName: newProfile.displayName,
        bio: newProfile.bio,
        profileType: newProfile.profileType,
        status: newProfile.status,
        isActive: true,
        isDefault: true, // First profile should be default
        settings: newProfile.settings,
        metadata: expect.anything(),
      });

      const dbProfile = await Profile.findById(res.body.id);
      expect(dbProfile).toBeDefined();
      expect(dbProfile.userId.toHexString()).toBe(userOne._id.toHexString());
    });

    test('should return 400 error if profile name is already taken for user', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      await insertProfiles([profileOne]);

      newProfile.profileName = profileOne.profileName;

      await request(app)
        .post('/v1/profiles')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newProfile)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v1/profiles').send(newProfile).expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v1/profiles', () => {
    test('should return 200 and apply the default query options', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      profileTwo.userId = userOne._id;
      await insertProfiles([profileOne, profileTwo]);

      const res = await request(app)
        .get('/v1/profiles')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
    });

    test('should return 401 if access token is missing', async () => {
      await request(app).get('/v1/profiles').expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v1/profiles/user', () => {
    test('should return 200 and user profiles', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      profileTwo.userId = userOne._id;
      await insertProfiles([profileOne, profileTwo]);

      const res = await request(app)
        .get('/v1/profiles/user')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toEqual({
        id: expect.anything(),
        userId: userOne._id.toHexString(),
        profileName: profileOne.profileName,
        displayName: profileOne.displayName,
        bio: profileOne.bio,
        avatar: profileOne.avatar,
        profileType: profileOne.profileType,
        status: profileOne.status,
        isActive: profileOne.isActive,
        isDefault: profileOne.isDefault,
        settings: profileOne.settings,
        metadata: profileOne.metadata,
      });
    });

    test('should return 401 if access token is missing', async () => {
      await request(app).get('/v1/profiles/user').expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v1/profiles/default', () => {
    test('should return 200 and default profile', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      await insertProfiles([profileOne]);

      const res = await request(app)
        .get('/v1/profiles/default')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: expect.anything(),
        userId: userOne._id.toHexString(),
        profileName: profileOne.profileName,
        displayName: profileOne.displayName,
        bio: profileOne.bio,
        avatar: profileOne.avatar,
        profileType: profileOne.profileType,
        status: profileOne.status,
        isActive: profileOne.isActive,
        isDefault: true,
        settings: profileOne.settings,
        metadata: profileOne.metadata,
      });
    });

    test('should return 404 if no default profile found', async () => {
      await insertUsers([userOne]);

      await request(app)
        .get('/v1/profiles/default')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/profiles/:profileId', () => {
    test('should return 200 and successfully update profile', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      await insertProfiles([profileOne]);

      const updateBody = {
        displayName: faker.name.findName(),
        bio: faker.lorem.sentence(),
        profileType: 'anonymous',
        status: 'private',
      };

      const res = await request(app)
        .patch(`/v1/profiles/${profileOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: profileOne._id.toHexString(),
        userId: userOne._id.toHexString(),
        profileName: profileOne.profileName,
        displayName: updateBody.displayName,
        bio: updateBody.bio,
        avatar: profileOne.avatar,
        profileType: updateBody.profileType,
        status: updateBody.status,
        isActive: profileOne.isActive,
        isDefault: profileOne.isDefault,
        settings: profileOne.settings,
        metadata: profileOne.metadata,
      });
    });

    test('should return 403 if user tries to update another user profile', async () => {
      await insertUsers([userOne, userTwo]);
      profileOne.userId = userTwo._id;
      await insertProfiles([profileOne]);

      const updateBody = { displayName: faker.name.findName() };

      await request(app)
        .patch(`/v1/profiles/${profileOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if profile does not exist', async () => {
      await insertUsers([userOne]);
      const updateBody = { displayName: faker.name.findName() };

      await request(app)
        .patch(`/v1/profiles/${profileOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/profiles/:profileId', () => {
    test('should return 204 if profile is deleted successfully', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      profileTwo.userId = userOne._id;
      await insertProfiles([profileOne, profileTwo]);

      await request(app)
        .delete(`/v1/profiles/${profileTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbProfile = await Profile.findById(profileTwo._id);
      expect(dbProfile).toBeNull();
    });

    test('should return 400 if trying to delete the only profile', async () => {
      await insertUsers([userOne]);
      profileOne.userId = userOne._id;
      await insertProfiles([profileOne]);

      await request(app)
        .delete(`/v1/profiles/${profileOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 403 if user tries to delete another user profile', async () => {
      await insertUsers([userOne, userTwo]);
      profileOne.userId = userTwo._id;
      await insertProfiles([profileOne]);

      await request(app)
        .delete(`/v1/profiles/${profileOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
