/**
 * Standardized API Response Formatter
 *
 * Provides consistent response structure across all API endpoints
 * Following REST API best practices
 */

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Optional metadata (pagination, etc.)
 */
function success(res, data, message = null, statusCode = 200, meta = null) {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Success response for CREATE operations
 * @param {Object} res - Express response object
 * @param {any} data - Created resource data
 * @param {string} message - Success message
 */
function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

/**
 * Success response for UPDATE operations
 * @param {Object} res - Express response object
 * @param {any} data - Updated resource data
 * @param {string} message - Success message
 */
function updated(res, data = null, message = 'Resource updated successfully') {
  return success(res, data, message, 200);
}

/**
 * Success response for DELETE operations
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
function deleted(res, message = 'Resource deleted successfully') {
  return success(res, null, message, 200);
}

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Optional message
 */
function paginated(res, data, pagination, message = null) {
  return success(res, data, message, 200, { pagination });
}

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Optional array of validation errors
 * @param {string} code - Optional error code for client handling
 */
function error(res, message, statusCode = 500, errors = null, code = null) {
  const response = {
    success: false,
    error: message
  };

  if (code) {
    response.code = code;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Don't expose stack traces in production
  if (process.env.NODE_ENV === 'development' && res.locals.errorStack) {
    response.stack = res.locals.errorStack;
  }

  return res.status(statusCode).json(response);
}

/**
 * Bad request error (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} errors - Optional validation errors
 */
function badRequest(res, message = 'Bad request', errors = null) {
  return error(res, message, 400, errors, 'BAD_REQUEST');
}

/**
 * Unauthorized error (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, null, 'UNAUTHORIZED');
}

/**
 * Forbidden error (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, null, 'FORBIDDEN');
}

/**
 * Not found error (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function notFound(res, message = 'Resource not found') {
  return error(res, message, 404, null, 'NOT_FOUND');
}

/**
 * Conflict error (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function conflict(res, message = 'Resource already exists') {
  return error(res, message, 409, null, 'CONFLICT');
}

/**
 * Validation error (422)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors
 */
function validationError(res, message = 'Validation failed', errors = []) {
  return error(res, message, 422, errors, 'VALIDATION_ERROR');
}

/**
 * Internal server error (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function serverError(res, message = 'Internal server error') {
  return error(res, message, 500, null, 'SERVER_ERROR');
}

/**
 * Format error from Express validator
 * @param {Array} validationErrors - Array of express-validator errors
 * @returns {Array} Formatted error array
 */
function formatValidationErrors(validationErrors) {
  return validationErrors.map(err => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value
  }));
}

/**
 * Response format examples:
 *
 * SUCCESS:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "Operation completed successfully" (optional)
 * }
 *
 * SUCCESS WITH PAGINATION:
 * {
 *   "success": true,
 *   "data": [ ... ],
 *   "meta": {
 *     "pagination": {
 *       "page": 1,
 *       "limit": 50,
 *       "total": 100,
 *       "totalPages": 2,
 *       "hasNextPage": true,
 *       "hasPrevPage": false
 *     }
 *   }
 * }
 *
 * ERROR:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "code": "ERROR_CODE",
 *   "errors": [                    // Optional validation errors
 *     {
 *       "field": "email",
 *       "message": "Invalid email format",
 *       "value": "invalid-email"
 *     }
 *   ]
 * }
 */

module.exports = {
  success,
  created,
  updated,
  deleted,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  formatValidationErrors
};
