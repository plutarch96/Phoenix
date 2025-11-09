/**
 * Pagination utility functions
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {number} defaultLimit - Default limit if not provided (default: 50)
 * @returns {Object} Parsed pagination parameters
 */
function parsePaginationParams(query, defaultLimit = 50) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || defaultLimit;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata object
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
function createPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

/**
 * Create a paginated response object
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total count
 * @returns {Object} Paginated response
 */
function createPaginatedResponse(data, page, limit, total) {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total)
  };
}

module.exports = {
  parsePaginationParams,
  createPaginationMeta,
  createPaginatedResponse
};
