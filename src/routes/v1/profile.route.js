const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const profileValidation = require('../../validations/profile.validation');
const profileController = require('../../controllers/profile.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageProfiles'), validate(profileValidation.createProfile), profileController.createProfile)
  .get(auth('getProfiles'), validate(profileValidation.getProfiles), profileController.getProfiles);

router.route('/user').get(auth('getProfiles'), profileController.getUserProfiles);

router.route('/default').get(auth('getProfiles'), profileController.getDefaultProfile);

router
  .route('/:profileId')
  .get(auth('getProfiles'), validate(profileValidation.getProfile), profileController.getProfile)
  .patch(auth('manageProfiles'), validate(profileValidation.updateProfile), profileController.updateProfile)
  .delete(auth('manageProfiles'), validate(profileValidation.deleteProfile), profileController.deleteProfile);

router
  .route('/:profileId/set-default')
  .patch(auth('manageProfiles'), validate(profileValidation.setDefaultProfile), profileController.setDefaultProfile);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: Profile management
 */

/**
 * @swagger
 * /profiles:
 *   post:
 *     summary: Create a profile
 *     description: Users can create multiple profiles for their account.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileName
 *               - displayName
 *             properties:
 *               profileName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Unique profile name for the user
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Display name for the profile
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: Profile bio
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 description: Avatar URL
 *               profileType:
 *                 type: string
 *                 enum: [public, anonymous]
 *                 default: public
 *               status:
 *                 type: string
 *                 enum: [private, public]
 *                 default: public
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               settings:
 *                 type: object
 *                 properties:
 *                   privacy:
 *                     type: string
 *                     enum: [public, private, friends]
 *                     default: public
 *                   notifications:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: boolean
 *                         default: true
 *                       push:
 *                         type: boolean
 *                         default: true
 *                       sms:
 *                         type: boolean
 *                         default: false
 *             example:
 *               profileName: "john_personal"
 *               displayName: "John Doe"
 *               bio: "Software developer and tech enthusiast"
 *               profileType: "public"
 *               status: "public"
 *               settings:
 *                 privacy: "public"
 *                 notifications:
 *                   email: true
 *                   push: true
 *                   sms: false
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Profile'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get profiles
 *     description: Get user's profiles with pagination.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: profileType
 *         schema:
 *           type: string
 *           enum: [public, anonymous]
 *         description: Filter by profile type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [private, public]
 *         description: Filter by profile status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of profiles
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /profiles/user:
 *   get:
 *     summary: Get user profiles
 *     description: Get all profiles for the authenticated user.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /profiles/default:
 *   get:
 *     summary: Get default profile
 *     description: Get the default profile for the authenticated user.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Profile'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /profiles/{id}:
 *   get:
 *     summary: Get a profile
 *     description: Get profile by id.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Profile'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a profile
 *     description: Update profile by id.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               avatar:
 *                 type: string
 *                 format: uri
 *               profileType:
 *                 type: string
 *                 enum: [public, anonymous]
 *               status:
 *                 type: string
 *                 enum: [private, public]
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *               settings:
 *                 type: object
 *                 properties:
 *                   privacy:
 *                     type: string
 *                     enum: [public, private, friends]
 *                   notifications:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: boolean
 *                       push:
 *                         type: boolean
 *                       sms:
 *                         type: boolean
 *             example:
 *               displayName: "John Doe - Updated"
 *               bio: "Senior Software Developer"
 *               profileType: "anonymous"
 *               status: "private"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Profile'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a profile
 *     description: Delete profile by id.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile id
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /profiles/{id}/set-default:
 *   patch:
 *     summary: Set profile as default
 *     description: Set a profile as the default profile for the user.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Profile'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
