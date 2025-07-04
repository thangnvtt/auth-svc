const httpStatus = require('http-status');
const { Question } = require('../models');
const ApiError = require('../utils/ApiError');
const categoryService = require('./category.service');

/**
 * Create a question
 * @param {Object} questionBody
 * @returns {Promise<Question>}
 */
const createQuestion = async (questionBody) => {
  const question = await Question.create(questionBody);

  // Increment question count for the category
  if (questionBody.categoryId) {
    await categoryService.incrementQuestionCount(questionBody.categoryId);
  }

  return question;
};

/**
 * Query for questions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryQuestions = async (filter, options) => {
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

  const questions = await Question.paginate(queryFilter, options);
  return questions;
};

/**
 * Get question by id
 * @param {ObjectId} id
 * @returns {Promise<Question>}
 */
const getQuestionById = async (id) => {
  return Question.findById(id).populate('profileId categoryId');
};

/**
 * Get questions by profile id
 * @param {ObjectId} profileId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getQuestionsByProfileId = async (profileId, options) => {
  const filter = { profileId };
  return Question.paginate(filter, options);
};

/**
 * Get questions by category id
 * @param {ObjectId} categoryId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getQuestionsByCategoryId = async (categoryId, options) => {
  const filter = { categoryId };
  return Question.paginate(filter, options);
};

/**
 * Update question by id
 * @param {ObjectId} questionId
 * @param {Object} updateBody
 * @returns {Promise<Question>}
 */
const updateQuestionById = async (questionId, updateBody) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  Object.assign(question, updateBody);
  await question.save();
  return question;
};

/**
 * Delete question by id
 * @param {ObjectId} questionId
 * @returns {Promise<Question>}
 */
const deleteQuestionById = async (questionId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  // Decrement question count for the category
  if (question.categoryId) {
    await categoryService.decrementQuestionCount(question.categoryId);
  }

  await question.deleteOne();
  return question;
};

/**
 * Like a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const likeQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.addLike(profileId);
};

/**
 * Unlike a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const unlikeQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.removeLike(profileId);
};

/**
 * Dislike a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const dislikeQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.addDislike(profileId);
};

/**
 * Remove dislike from a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const removeDislikeQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.removeDislike(profileId);
};

/**
 * Save a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const saveQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.addSave(profileId);
};

/**
 * Unsave a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const unsaveQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.removeSave(profileId);
};

/**
 * Share a question
 * @param {ObjectId} questionId
 * @param {ObjectId} profileId
 * @returns {Promise<Question>}
 */
const shareQuestion = async (questionId, profileId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  return question.addShare(profileId);
};

/**
 * Get trending questions
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTrendingQuestions = async (options) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filter = {
    createdAt: { $gte: sevenDaysAgo },
    isActive: true,
  };

  // Sort by engagement score (likes + saves + shares)
  const sortBy = 'engagementScore:desc';
  const trendingOptions = { ...options, sortBy };

  return Question.paginate(filter, trendingOptions);
};

/**
 * Get popular questions
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPopularQuestions = async (options) => {
  const filter = { isActive: true };

  // Sort by total likes
  const sortBy = 'likeCount:desc';
  const popularOptions = { ...options, sortBy };

  return Question.paginate(filter, popularOptions);
};

/**
 * Get recent questions
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getRecentQuestions = async (options) => {
  const filter = { isActive: true };

  // Sort by creation date
  const sortBy = 'createdAt:desc';
  const recentOptions = { ...options, sortBy };

  return Question.paginate(filter, recentOptions);
};

/**
 * Get unanswered questions
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getUnansweredQuestions = async (options) => {
  const filter = { isAnswered: false, isActive: true };

  return Question.paginate(filter, options);
};

module.exports = {
  createQuestion,
  queryQuestions,
  getQuestionById,
  getQuestionsByProfileId,
  getQuestionsByCategoryId,
  updateQuestionById,
  deleteQuestionById,
  likeQuestion,
  unlikeQuestion,
  dislikeQuestion,
  removeDislikeQuestion,
  saveQuestion,
  unsaveQuestion,
  shareQuestion,
  getTrendingQuestions,
  getPopularQuestions,
  getRecentQuestions,
  getUnansweredQuestions,
};
