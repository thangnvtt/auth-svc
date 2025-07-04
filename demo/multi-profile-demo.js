#!/usr/bin/env node

/**
 * Demo script showing multi-profile functionality
 * This script demonstrates how to use the multi-profile feature
 */

const mongoose = require('mongoose');
const config = require('../src/config/config');
const { User, Profile } = require('../src/models');

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options);

async function demoMultiProfile() {
  console.log('🚀 Multi-Profile Demo Starting...\n');

  try {
    // Create a demo user
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@example.com',
      fullname: 'Demo User Full Name',
      phone: '+1234567890',
      birthdate: new Date('1990-01-01'),
      password: 'password123',
      role: 'user',
      isEmailVerified: true,
    });

    await demoUser.save();
    console.log('✅ Demo user created:', demoUser.email);

    // Create multiple profiles for the user
    const personalProfile = new Profile({
      userId: demoUser._id,
      profileName: 'demo_personal',
      displayName: 'Demo Personal',
      bio: 'This is my personal profile for casual interactions',
      profileType: 'personal',
      isDefault: true,
      settings: {
        privacy: 'public',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
    });

    const businessProfile = new Profile({
      userId: demoUser._id,
      profileName: 'demo_business',
      displayName: 'Demo Business Pro',
      bio: 'CEO & Founder - Business profile for professional networking',
      profileType: 'business',
      isDefault: false,
      settings: {
        privacy: 'private',
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
      },
      metadata: {
        company: 'Demo Corp',
        position: 'CEO',
        website: 'https://demo-corp.com',
      },
    });

    const creativeProfile = new Profile({
      userId: demoUser._id,
      profileName: 'demo_creative',
      displayName: 'Demo Artist',
      bio: 'Digital artist and creative professional',
      profileType: 'creative',
      isDefault: false,
      settings: {
        privacy: 'friends',
        notifications: {
          email: false,
          push: true,
          sms: false,
        },
      },
      metadata: {
        artStyle: 'Digital Art',
        portfolio: 'https://demo-artist.com',
        instagram: '@demo_artist',
      },
    });

    await personalProfile.save();
    await businessProfile.save();
    await creativeProfile.save();

    console.log('✅ Created 3 profiles for the user:\n');

    // Demonstrate profile retrieval
    const userProfiles = await demoUser.getProfiles();
    console.log('📋 User Profiles:');
    userProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.displayName} (${profile.profileType})`);
      console.log(`   - Profile Name: ${profile.profileName}`);
      console.log(`   - Bio: ${profile.bio}`);
      console.log(`   - Default: ${profile.isDefault ? 'Yes' : 'No'}`);
      console.log(`   - Privacy: ${profile.settings.privacy}`);
      console.log('');
    });

    // Demonstrate default profile retrieval
    const defaultProfile = await demoUser.getDefaultProfile();
    console.log('⭐ Default Profile:', defaultProfile.displayName);
    console.log('');

    // Demonstrate profile switching (setting new default)
    await Profile.setAsDefault(demoUser._id, businessProfile._id);
    console.log('🔄 Switched default profile to Business Profile');

    const newDefaultProfile = await demoUser.getDefaultProfile();
    console.log('⭐ New Default Profile:', newDefaultProfile.displayName);
    console.log('');

    // Demonstrate profile updates
    businessProfile.bio = 'Updated: Senior Executive with 10+ years experience';
    businessProfile.metadata.set('linkedIn', 'https://linkedin.com/in/demo-user');
    await businessProfile.save();
    console.log('✏️  Updated business profile bio and metadata');
    console.log('');

    // Demonstrate profile querying
    const businessProfiles = await Profile.find({ userId: demoUser._id, profileType: 'business' });
    console.log('🔍 Business Profiles Found:', businessProfiles.length);
    console.log('');

    // Demonstrate profile deletion
    await Profile.deleteOne({ _id: creativeProfile._id });
    console.log('🗑️  Deleted creative profile');

    const remainingProfiles = await demoUser.getProfiles();
    console.log('📋 Remaining Profiles:', remainingProfiles.length);
    console.log('');

    // Cleanup
    await Profile.deleteMany({ userId: demoUser._id });
    await User.deleteOne({ _id: demoUser._id });
    console.log('🧹 Cleaned up demo data');

    console.log('✅ Multi-Profile Demo Completed Successfully!');
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demoMultiProfile();
}

module.exports = demoMultiProfile;
