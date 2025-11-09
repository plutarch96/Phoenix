/**
 * EXAMPLE: Standardized API Response Format
 *
 * This file demonstrates the use of standardized response formatters
 * across different endpoint types.
 *
 * Compare this with existing routes to see the consistency improvement.
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const dbHelpers = require('../utils/dbHelpers');
const response = require('../utils/responseFormatter');
const { parsePaginationParams } = require('../utils/pagination');

/**
 * BEFORE (Inconsistent responses):
 *
 * Endpoint A: res.json({ id: 1, name: 'Test' })
 * Endpoint B: res.json({ data: { id: 1 }, message: 'Success' })
 * Endpoint C: res.status(201).json({ success: true, userId: 1 })
 * Endpoint D: res.status(500).json({ error: 'Failed' })
 * Endpoint E: res.status(400).json({ message: 'Bad request', details: [...] })
 */

/**
 * AFTER (Standardized responses):
 * All endpoints follow the same pattern with clear semantics
 */

// ============================================================================
// LIST ENDPOINTS (with pagination)
// ============================================================================

/**
 * Get all items with pagination
 * Response includes data and pagination metadata
 */
router.get('/items', verifyToken, async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query, 50);

    const total = await dbHelpers.get('SELECT COUNT(*) as count FROM items');
    const items = await dbHelpers.all(
      'SELECT * FROM items ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const pagination = {
      page,
      limit,
      total: total.count,
      totalPages: Math.ceil(total.count / limit),
      hasNextPage: (offset + limit) < total.count,
      hasPrevPage: page > 1
    };

    return response.paginated(res, items, pagination);

    /* Response:
    {
      "success": true,
      "data": [...],
      "meta": {
        "pagination": {
          "page": 1,
          "limit": 50,
          "total": 100,
          "totalPages": 2,
          "hasNextPage": true,
          "hasPrevPage": false
        }
      }
    }
    */

  } catch (error) {
    console.error('Error fetching items:', error);
    return response.serverError(res, 'Failed to fetch items');
  }
});

// ============================================================================
// GET SINGLE RESOURCE
// ============================================================================

/**
 * Get single item by ID
 */
router.get('/items/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await dbHelpers.get('SELECT * FROM items WHERE id = ?', [id]);

    if (!item) {
      return response.notFound(res, 'Item not found');
      /* Response:
      {
        "success": false,
        "error": "Item not found",
        "code": "NOT_FOUND"
      }
      */
    }

    return response.success(res, item);
    /* Response:
    {
      "success": true,
      "data": { id: 1, name: "Item 1", ... }
    }
    */

  } catch (error) {
    console.error('Error fetching item:', error);
    return response.serverError(res, 'Failed to fetch item');
  }
});

// ============================================================================
// CREATE RESOURCE
// ============================================================================

/**
 * Create new item
 */
router.post('/items', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name) {
      return response.badRequest(res, 'Name is required');
      /* Response:
      {
        "success": false,
        "error": "Name is required",
        "code": "BAD_REQUEST"
      }
      */
    }

    // Check for duplicates
    const existing = await dbHelpers.get('SELECT id FROM items WHERE name = ?', [name]);
    if (existing) {
      return response.conflict(res, 'Item with this name already exists');
      /* Response:
      {
        "success": false,
        "error": "Item with this name already exists",
        "code": "CONFLICT"
      }
      */
    }

    // Create item
    const result = await dbHelpers.run(
      'INSERT INTO items (name, description) VALUES (?, ?)',
      [name, description]
    );

    const newItem = await dbHelpers.get('SELECT * FROM items WHERE id = ?', [result.lastID]);

    return response.created(res, newItem, 'Item created successfully');
    /* Response:
    {
      "success": true,
      "data": { id: 1, name: "New Item", ... },
      "message": "Item created successfully"
    }
    */

  } catch (error) {
    console.error('Error creating item:', error);
    return response.serverError(res, 'Failed to create item');
  }
});

// ============================================================================
// UPDATE RESOURCE
// ============================================================================

/**
 * Update item
 */
router.put('/items/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const exists = await dbHelpers.exists('items', 'id', id);
    if (!exists) {
      return response.notFound(res, 'Item not found');
    }

    await dbHelpers.run(
      'UPDATE items SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    const updatedItem = await dbHelpers.get('SELECT * FROM items WHERE id = ?', [id]);

    return response.updated(res, updatedItem, 'Item updated successfully');
    /* Response:
    {
      "success": true,
      "data": { id: 1, name: "Updated Item", ... },
      "message": "Item updated successfully"
    }
    */

  } catch (error) {
    console.error('Error updating item:', error);
    return response.serverError(res, 'Failed to update item');
  }
});

// ============================================================================
// DELETE RESOURCE
// ============================================================================

/**
 * Delete item
 */
router.delete('/items/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await dbHelpers.exists('items', 'id', id);
    if (!exists) {
      return response.notFound(res, 'Item not found');
    }

    await dbHelpers.run('DELETE FROM items WHERE id = ?', [id]);

    return response.deleted(res, 'Item deleted successfully');
    /* Response:
    {
      "success": true,
      "data": null,
      "message": "Item deleted successfully"
    }
    */

  } catch (error) {
    console.error('Error deleting item:', error);
    return response.serverError(res, 'Failed to delete item');
  }
});

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Example with validation errors
 */
router.post('/items/validate', verifyToken, async (req, res) => {
  const errors = [];

  if (!req.body.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!req.body.email || !req.body.email.includes('@')) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  if (req.body.age && req.body.age < 18) {
    errors.push({ field: 'age', message: 'Must be 18 or older' });
  }

  if (errors.length > 0) {
    return response.validationError(res, 'Validation failed', errors);
    /* Response:
    {
      "success": false,
      "error": "Validation failed",
      "code": "VALIDATION_ERROR",
      "errors": [
        { "field": "name", "message": "Name is required" },
        { "field": "email", "message": "Valid email is required" }
      ]
    }
    */
  }

  return response.created(res, req.body, 'Validation passed');
});

// ============================================================================
// AUTHORIZATION ERRORS
// ============================================================================

/**
 * Example authorization checks
 */
router.get('/admin-only', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return response.forbidden(res, 'Admin access required');
    /* Response:
    {
      "success": false,
      "error": "Admin access required",
      "code": "FORBIDDEN"
    }
    */
  }

  const data = { adminData: 'sensitive information' };
  return response.success(res, data);
});

/**
 * Example authentication check
 */
router.get('/public-data', async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return response.unauthorized(res, 'Authentication required');
    /* Response:
    {
      "success": false,
      "error": "Authentication required",
      "code": "UNAUTHORIZED"
    }
    */
  }

  const data = { publicData: 'public information' };
  return response.success(res, data);
});

// ============================================================================
// BENEFITS OF STANDARDIZED RESPONSES
// ============================================================================

/**
 * 1. CONSISTENCY
 *    - All endpoints follow the same structure
 *    - Frontend can expect predictable response format
 *    - Easy to build generic error handlers
 *
 * 2. CLARITY
 *    - `success` field immediately tells if operation succeeded
 *    - `code` field allows client-side error type checking
 *    - Semantic HTTP status codes
 *
 * 3. MAINTAINABILITY
 *    - Single source of truth for response format
 *    - Easy to update format across all endpoints
 *    - Self-documenting code
 *
 * 4. CLIENT INTEGRATION
 *    - Frontend can create typed interfaces
 *    - Generic error handling becomes trivial
 *    - Better TypeScript/JSDoc support
 *
 * 5. API DOCUMENTATION
 *    - Easier to document with consistent format
 *    - OpenAPI/Swagger generation becomes simpler
 *    - Examples are consistent
 *
 * EXAMPLE FRONTEND USAGE:
 *
 * ```javascript
 * async function fetchItems() {
 *   try {
 *     const response = await fetch('/api/items');
 *     const result = await response.json();
 *
 *     if (result.success) {
 *       // Handle success
 *       console.log(result.data);
 *       if (result.meta?.pagination) {
 *         console.log(`Page ${result.meta.pagination.page} of ${result.meta.pagination.totalPages}`);
 *       }
 *     } else {
 *       // Handle error
 *       console.error(result.error);
 *       if (result.errors) {
 *         result.errors.forEach(err => {
 *           console.error(`${err.field}: ${err.message}`);
 *         });
 *       }
 *     }
 *   } catch (error) {
 *     console.error('Network error:', error);
 *   }
 * }
 * ```
 */

module.exports = router;
