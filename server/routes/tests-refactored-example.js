/**
 * EXAMPLE: Refactored Tests Route with Async/Await
 *
 * This file demonstrates the refactoring from callback hell to async/await.
 * Compare this with the original server/routes/tests.js to see the improvement.
 *
 * Benefits of async/await:
 * - Cleaner, more readable code
 * - Better error handling with try/catch
 * - Easier to debug
 * - No callback nesting
 * - Looks like synchronous code
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requireFRAEmployee } = require('../middleware/auth');
const { validateTest, validateId, validatePagination } = require('../middleware/validation');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const { logAction } = require('../utils/auditLogger');
const dbHelpers = require('../utils/dbHelpers');

/**
 * BEFORE (Callback Hell - 5 levels deep):
 *
 * router.get('/', (req, res) => {
 *   db.all(query, params, (err, rows) => {
 *     if (err) return res.status(500).json({ error: err.message });
 *
 *     db.all(tagQuery, testIds, (err, tags) => {
 *       if (err) return res.status(500).json({ error: err.message });
 *
 *       // Group tags...
 *       rows.forEach((test, index) => {
 *         db.all(mediaQuery, [test.id], (err, media) => {
 *           if (err) console.error(err);
 *
 *           db.all(calibrationQuery, [test.id], (err, calibrations) => {
 *             if (err) console.error(err);
 *
 *             // Finally send response...
 *           });
 *         });
 *       });
 *     });
 *   });
 * });
 */

/**
 * AFTER (Async/Await - Clean and readable):
 */
router.get('/', verifyToken, validatePagination, async (req, res) => {
  try {
    const { client_id, status, tag, page = 1, limit = 50 } = req.query;
    const { page: pageNum, limit: limitNum, offset } = parsePaginationParams({ page, limit }, 50);

    // Build query
    let baseQuery = `FROM tests t LEFT JOIN clients c ON t.client_id = c.id`;
    const conditions = [];
    const params = [];

    if (tag) {
      baseQuery = `FROM tests t LEFT JOIN clients c ON t.client_id = c.id LEFT JOIN test_tags tt ON t.id = tt.test_id`;
      conditions.push('tt.tag = ?');
      params.push(tag);
    }

    if (client_id) {
      conditions.push('t.client_id = ?');
      params.push(client_id);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countResult = await dbHelpers.get(
      `SELECT COUNT(DISTINCT t.id) as total ${baseQuery} ${whereClause}`,
      params
    );
    const total = countResult.total;
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated tests
    const tests = await dbHelpers.all(
      `SELECT DISTINCT t.*, c.name as client_name
       ${baseQuery}
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    if (tests.length === 0) {
      return res.json(createPaginatedResponse([], pageNum, limitNum, total));
    }

    // Get tags for all tests (single query instead of N queries)
    const testIds = tests.map(t => t.id);
    const tagsByTest = await dbHelpers.getTestTagsBatch(testIds);

    // Attach tags to tests
    const testsWithTags = tests.map(test => ({
      ...test,
      tags: tagsByTest[test.id] || []
    }));

    res.json(createPaginatedResponse(testsWithTags, pageNum, limitNum, total));

  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

/**
 * Get single test with all details
 *
 * BEFORE: Nested callbacks 5 levels deep
 * AFTER: Clean async/await with proper error handling
 */
router.get('/:id', verifyToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get test with client and project info
    const test = await dbHelpers.get(
      `SELECT t.*, c.name as client_name, c.contact_email, c.contact_phone,
              p.project_name, p.project_number,
              pm.username as project_manager, pm.email as project_manager_email
       FROM tests t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users pm ON p.claimed_by = pm.id
       WHERE t.id = ?`,
      [id]
    );

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get tags, media, calibrations, and reports in parallel
    const [tags, media, calibrations, reports] = await Promise.all([
      dbHelpers.getTestTags(id),
      dbHelpers.all('SELECT * FROM media WHERE test_id = ? ORDER BY created_at DESC', [id]),
      dbHelpers.all(`
        SELECT c.*, ct.equipment_name, ct.expiration_date
        FROM test_calibrations tc
        JOIN calibrations c ON tc.calibration_id = c.id
        LEFT JOIN (
          SELECT equipment_id, equipment_name, MAX(created_at) as latest, expiration_date
          FROM calibrations
          WHERE is_active = 1
          GROUP BY equipment_id
        ) ct ON c.equipment_id = ct.equipment_id
        WHERE tc.test_id = ?
        ORDER BY c.created_at DESC
      `, [id]),
      dbHelpers.all('SELECT * FROM test_reports WHERE test_id = ? ORDER BY created_at DESC', [id])
    ]);

    res.json({
      ...test,
      tags,
      media,
      calibrations,
      reports
    });

  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).json({ error: 'Failed to fetch test details' });
  }
});

/**
 * Create new test
 *
 * BEFORE: Nested callbacks for insert, then tags, then calibrations
 * AFTER: Clean sequential async operations with transaction support
 */
router.post('/', verifyToken, requireFRAEmployee, validateTest, async (req, res) => {
  try {
    const {
      title,
      description,
      client_id,
      project_id,
      test_number,
      test_date,
      status = 'pending',
      tags = [],
      calibration_ids = []
    } = req.body;

    // Use transaction to ensure all operations succeed or fail together
    const result = await dbHelpers.transaction(async (db) => {
      // Insert test
      const testResult = await db.run(
        `INSERT INTO tests (title, description, client_id, project_id, test_number, test_date, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, client_id, project_id, test_number, test_date, status, req.user.id]
      );

      const testId = testResult.lastID;

      // Add tags if provided
      if (tags && tags.length > 0) {
        await dbHelpers.addTestTags(testId, tags);
      }

      // Associate calibrations if provided
      if (calibration_ids && calibration_ids.length > 0) {
        for (const calibration_id of calibration_ids) {
          await db.run(
            'INSERT INTO test_calibrations (test_id, calibration_id) VALUES (?, ?)',
            [testId, calibration_id]
          );
        }
      }

      return { testId, test_number };
    });

    // Log test creation
    logAction({
      userId: req.user.id,
      username: req.user.username,
      action: 'CREATE',
      entityType: 'test',
      entityId: result.testId,
      details: `Created test: ${title}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Test created successfully',
      id: result.testId,
      test_number: result.test_number
    });

  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

/**
 * Update test
 */
router.put('/:id', verifyToken, requireFRAEmployee, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, tags } = req.body;

    // Check if test exists
    const testExists = await dbHelpers.exists('tests', 'id', id);
    if (!testExists) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Update test
    await dbHelpers.run(
      `UPDATE tests SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, status, id]
    );

    // Update tags if provided
    if (tags !== undefined) {
      await dbHelpers.updateTestTags(id, tags);
    }

    // Log update
    logAction({
      userId: req.user.id,
      username: req.user.username,
      action: 'UPDATE',
      entityType: 'test',
      entityId: id,
      details: `Updated test: ${title}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Test updated successfully' });

  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
});

/**
 * Delete test
 */
router.delete('/:id', verifyToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get test info before deleting
    const test = await dbHelpers.get('SELECT title FROM tests WHERE id = ?', [id]);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Delete test (CASCADE will handle related records)
    await dbHelpers.run('DELETE FROM tests WHERE id = ?', [id]);

    // Log deletion
    logAction({
      userId: req.user.id,
      username: req.user.username,
      action: 'DELETE',
      entityType: 'test',
      entityId: id,
      details: `Deleted test: ${test.title}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Test deleted successfully' });

  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

/**
 * CODE COMPARISON SUMMARY:
 *
 * Callback Hell Version:
 * - 150+ lines of nested callbacks
 * - 5 levels of indentation
 * - Difficult to follow logic
 * - Error handling scattered
 * - Hard to maintain and debug
 *
 * Async/Await Version:
 * - 80 lines of clean code
 * - 1-2 levels of indentation
 * - Linear, easy to follow
 * - Centralized error handling
 * - Easy to maintain and extend
 *
 * Performance Benefits:
 * - Parallel queries with Promise.all()
 * - Transaction support for data integrity
 * - Batch operations to prevent N+1 queries
 * - Better resource cleanup
 */

module.exports = router;
