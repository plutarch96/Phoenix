const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation rules for user creation/update
 */
const validateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .isIn(['admin', 'project_manager', 'staff', 'employee', 'client'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for client creation/update
 */
const validateClient = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Client name must be between 1 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-.,&'()]+$/)
    .withMessage('Client name contains invalid characters'),
  body('client_number')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Client number can only contain letters, numbers, and hyphens'),
  body('contact_email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('contact_phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-().+]+$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors
];

/**
 * Validation rules for project creation/update
 */
const validateProject = [
  body('project_name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name must be between 1 and 200 characters'),
  body('client_id')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('project_number')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Project number can only contain letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'completed'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

/**
 * Validation rules for test creation/update
 */
const validateTest = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('client_id')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('project_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid project ID required if provided'),
  body('test_number')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Test number can only contain letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'failed'])
    .withMessage('Invalid status'),
  body('test_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  handleValidationErrors
];

/**
 * Validation rules for calibration creation/update
 */
const validateCalibration = [
  body('equipment_name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Equipment name must be between 1 and 200 characters'),
  body('equipment_id')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Equipment ID must be between 1 and 100 characters'),
  body('serial_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Serial number must not exceed 100 characters'),
  body('calibration_date')
    .isISO8601()
    .withMessage('Invalid calibration date format'),
  body('due_date')
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('calibrated_by')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Calibrated by must be between 1 and 100 characters'),
  handleValidationErrors
];

/**
 * Validation for ID parameters
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
  handleValidationErrors
];

/**
 * Validation for pagination parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Validation for search queries
 */
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUser,
  validateLogin,
  validateClient,
  validateProject,
  validateTest,
  validateCalibration,
  validateId,
  validatePagination,
  validateSearch
};
