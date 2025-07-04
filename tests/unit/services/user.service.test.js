const { Profile } = require('../../../src/models');
const { userService, profileService } = require('../../../src/services');
const setupTestDB = require('../../utils/setupTestDB');
const { profileTypes, profileStatuses } = require('../../../src/config/profileEnums');

setupTestDB();

describe('User Service Auto Profile Creation', () => {
  test('should create public and anonymous profiles when user is created', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      username: 'johndoe123',
      password: 'password1',
      fullname: 'John Doe Full',
      phone: '+12345678901',
      birthdate: new Date('1990-01-01'),
    };

    const user = await userService.createUser(userData);

    // Check if profiles were created
    const profiles = await Profile.find({ userId: user._id });
    expect(profiles).toHaveLength(2);

    // Check public profile
    const publicProfile = profiles.find((p) => p.profileType === profileTypes.PUBLIC);
    expect(publicProfile).toBeDefined();
    expect(publicProfile.profileName).toBe('John Doe');
    expect(publicProfile.displayName).toBe('John Doe');
    expect(publicProfile.profileType).toBe(profileTypes.PUBLIC);
    expect(publicProfile.status).toBe(profileStatuses.PUBLIC);
    expect(publicProfile.isDefault).toBe(true);

    // Check anonymous profile
    const anonymousProfile = profiles.find((p) => p.profileType === profileTypes.ANONYMOUS);
    expect(anonymousProfile).toBeDefined();
    expect(anonymousProfile.profileName).toMatch(/^Neswa\d{6}$/);
    expect(anonymousProfile.displayName).toBe('Anonymous User');
    expect(anonymousProfile.profileType).toBe(profileTypes.ANONYMOUS);
    expect(anonymousProfile.status).toBe(profileStatuses.PRIVATE);
    expect(anonymousProfile.isDefault).toBe(false);
  });

  test('should still create user if profile creation fails', async () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      username: 'janedoe456',
      password: 'password1',
      fullname: 'Jane Doe Full',
      phone: '+12345678902',
      birthdate: new Date('1990-01-01'),
    };

    // Mock profile service to simulate failure
    const originalCreateProfile = profileService.createProfile;
    const mockCreateProfile = jest.fn().mockRejectedValue(new Error('Profile creation failed'));

    // Replace the function temporarily
    profileService.createProfile = mockCreateProfile;

    const user = await userService.createUser(userData);

    // User should still be created
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);

    // Restore original function
    profileService.createProfile = originalCreateProfile;
  });
});
