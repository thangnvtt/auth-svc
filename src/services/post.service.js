const httpStatus = require('http-status');
const { Post } = require('../models');
const ApiError = require('../utils/ApiError');
const categoryService = require('./category.service');

/**
 * Create a post
 * @param {Object} postBody
 * @returns {Promise<Post>}
 */
const createPost = async (postBody) => {
  const post = await Post.create(postBody);

  // Increment post count for the category
  if (postBody.categoryId) {
    await categoryService.incrementPostCount(postBody.categoryId);
  }

  return post;
};

/**
 * Query for posts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPosts = async (filter, options) => {
  let queryFilter = filter;

  // Handle search query
  if (filter.search) {
    const escapedQuery = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchFilter = {
      $or: [
        { title: { $regex: escapedQuery, $options: 'i' } },
        { content: { $regex: escapedQuery, $options: 'i' } },
        { tags: { $regex: escapedQuery, $options: 'i' } },
      ],
    };

    // Remove search from filter and add search conditions
    const { search, ...otherFilters } = filter;
    queryFilter = { ...otherFilters, ...searchFilter };
  }

  const posts = await Post.paginate(queryFilter, options);
  return posts;
};

/**
 * Get post by id
 * @param {ObjectId} id
 * @returns {Promise<Post>}
 */
const getPostById = async (id) => {
  return Post.findById(id).populate('profileId categoryId');
};

/**
 * Get posts by profile id
 * @param {ObjectId} profileId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPostsByProfileId = async (profileId, options) => {
  const filter = { profileId };
  return Post.paginate(filter, options);
};

/**
 * Get posts by category id
 * @param {ObjectId} categoryId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPostsByCategoryId = async (categoryId, options) => {
  const filter = { categoryId };
  return Post.paginate(filter, options);
};

/**
 * Update post by id
 * @param {ObjectId} postId
 * @param {Object} updateBody
 * @returns {Promise<Post>}
 */
const updatePostById = async (postId, updateBody) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  Object.assign(post, updateBody);
  await post.save();
  return post;
};

/**
 * Delete post by id
 * @param {ObjectId} postId
 * @returns {Promise<Post>}
 */
const deletePostById = async (postId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  // Decrement post count for the category
  if (post.categoryId) {
    await categoryService.decrementPostCount(post.categoryId);
  }

  await post.deleteOne();
  return post;
};

/**
 * Like a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const likePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.addLike(profileId);
};

/**
 * Unlike a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const unlikePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.removeLike(profileId);
};

/**
 * Dislike a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const dislikePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.addDislike(profileId);
};

/**
 * Remove dislike from a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const removeDislikePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.removeDislike(profileId);
};

/**
 * Save a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const savePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.addSave(profileId);
};

/**
 * Unsave a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const unsavePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.removeSave(profileId);
};

/**
 * Share a post
 * @param {ObjectId} postId
 * @param {ObjectId} profileId
 * @returns {Promise<Post>}
 */
const sharePost = async (postId, profileId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post.addShare(profileId);
};

/**
 * Get trending posts
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTrendingPosts = async (options) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filter = {
    createdAt: { $gte: sevenDaysAgo },
    isActive: true,
  };

  // Sort by engagement score (likes + saves + shares)
  const sortBy = 'engagementScore:desc';
  const trendingOptions = { ...options, sortBy };

  return Post.paginate(filter, trendingOptions);
};

/**
 * Get popular posts
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPopularPosts = async (options) => {
  const filter = { isActive: true };

  // Sort by total likes
  const sortBy = 'likeCount:desc';
  const popularOptions = { ...options, sortBy };

  return Post.paginate(filter, popularOptions);
};

/**
 * Get recent posts
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getRecentPosts = async (options) => {
  const filter = { isActive: true };

  // Sort by creation date
  const sortBy = 'createdAt:desc';
  const recentOptions = { ...options, sortBy };

  return Post.paginate(filter, recentOptions);
};

module.exports = {
  createPost,
  queryPosts,
  getPostById,
  getPostsByProfileId,
  getPostsByCategoryId,
  updatePostById,
  deletePostById,
  likePost,
  unlikePost,
  dislikePost,
  removeDislikePost,
  savePost,
  unsavePost,
  sharePost,
  getTrendingPosts,
  getPopularPosts,
  getRecentPosts,
};
