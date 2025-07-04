const httpStatus = require('http-status');
const { Category } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a category
 * @param {Object} categoryBody
 * @returns {Promise<Category>}
 */
const createCategory = async (categoryBody) => {
  return Category.create(categoryBody);
};

/**
 * Query for categories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCategories = async (filter, options) => {
  let queryFilter = filter;

  // Handle search query
  if (filter.search) {
    const escapedQuery = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchFilter = {
      $or: [{ name: { $regex: escapedQuery, $options: 'i' } }, { description: { $regex: escapedQuery, $options: 'i' } }],
    };

    // Remove search from filter and add search conditions
    const { search, ...otherFilters } = filter;
    queryFilter = { ...otherFilters, ...searchFilter };
  }

  const categories = await Category.paginate(queryFilter, options);
  return categories;
};

/**
 * Get category by id
 * @param {ObjectId} id
 * @returns {Promise<Category>}
 */
const getCategoryById = async (id) => {
  return Category.findById(id);
};

/**
 * Get category by name
 * @param {string} name
 * @returns {Promise<Category>}
 */
const getCategoryByName = async (name) => {
  return Category.findOne({ name });
};

/**
 * Update category by id
 * @param {ObjectId} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryById = async (categoryId, updateBody) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  Object.assign(category, updateBody);
  await category.save();
  return category;
};

/**
 * Delete category by id
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  await category.deleteOne();
  return category;
};

/**
 * Increment post count for category
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const incrementPostCount = async (categoryId) => {
  return Category.findByIdAndUpdate(categoryId, { $inc: { postCount: 1 } }, { new: true });
};

/**
 * Decrement post count for category
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const decrementPostCount = async (categoryId) => {
  return Category.findByIdAndUpdate(categoryId, { $inc: { postCount: -1 } }, { new: true });
};

/**
 * Increment question count for category
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const incrementQuestionCount = async (categoryId) => {
  return Category.findByIdAndUpdate(categoryId, { $inc: { questionCount: 1 } }, { new: true });
};

/**
 * Decrement question count for category
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const decrementQuestionCount = async (categoryId) => {
  return Category.findByIdAndUpdate(categoryId, { $inc: { questionCount: -1 } }, { new: true });
};

module.exports = {
  createCategory,
  queryCategories,
  getCategoryById,
  getCategoryByName,
  updateCategoryById,
  deleteCategoryById,
  incrementPostCount,
  decrementPostCount,
  incrementQuestionCount,
  decrementQuestionCount,
};
