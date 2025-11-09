/**
 * Database Helper Utilities
 *
 * Promisified database operations to enable async/await pattern
 * instead of callback hell.
 */

const db = require('../db/database');

/**
 * Promisified db.get - Get single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Single row result
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Promisified db.all - Get all rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of rows
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Promisified db.run - Execute query (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Result with lastID and changes
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Async function that performs queries
 * @returns {Promise<any>} Result of the transaction
 */
async function transaction(callback) {
  try {
    await run('BEGIN TRANSACTION');
    const result = await callback({ get, all, run });
    await run('COMMIT');
    return result;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

/**
 * Get tags for a single test
 * @param {number} testId - Test ID
 * @returns {Promise<Array<string>>} Array of tag names
 */
async function getTestTags(testId) {
  const tags = await all(
    'SELECT tag FROM test_tags WHERE test_id = ? ORDER BY tag',
    [testId]
  );
  return tags.map(t => t.tag);
}

/**
 * Get tags for multiple tests (prevents N+1 query)
 * @param {Array<number>} testIds - Array of test IDs
 * @returns {Promise<Object>} Object mapping test_id to array of tags
 */
async function getTestTagsBatch(testIds) {
  if (testIds.length === 0) return {};

  const placeholders = testIds.map(() => '?').join(',');
  const tags = await all(
    `SELECT test_id, tag FROM test_tags WHERE test_id IN (${placeholders}) ORDER BY tag`,
    testIds
  );

  const tagsByTest = {};
  tags.forEach(t => {
    if (!tagsByTest[t.test_id]) {
      tagsByTest[t.test_id] = [];
    }
    tagsByTest[t.test_id].push(t.tag);
  });

  return tagsByTest;
}

/**
 * Add tags to a test
 * @param {number} testId - Test ID
 * @param {Array<string>} tags - Array of tag names
 * @returns {Promise<void>}
 */
async function addTestTags(testId, tags) {
  if (!tags || tags.length === 0) return;

  const uniqueTags = [...new Set(tags)]; // Remove duplicates

  for (const tag of uniqueTags) {
    await run(
      'INSERT OR IGNORE INTO test_tags (test_id, tag) VALUES (?, ?)',
      [testId, tag]
    );
  }
}

/**
 * Remove all tags from a test
 * @param {number} testId - Test ID
 * @returns {Promise<void>}
 */
async function removeTestTags(testId) {
  await run('DELETE FROM test_tags WHERE test_id = ?', [testId]);
}

/**
 * Update tags for a test (remove old, add new)
 * @param {number} testId - Test ID
 * @param {Array<string>} newTags - New array of tag names
 * @returns {Promise<void>}
 */
async function updateTestTags(testId, newTags) {
  await removeTestTags(testId);
  await addTestTags(testId, newTags);
}

/**
 * Check if a record exists
 * @param {string} table - Table name
 * @param {string} column - Column name to check
 * @param {any} value - Value to check for
 * @returns {Promise<boolean>} True if exists
 */
async function exists(table, column, value) {
  const row = await get(
    `SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`,
    [value]
  );
  return !!row;
}

module.exports = {
  get,
  all,
  run,
  transaction,
  getTestTags,
  getTestTagsBatch,
  addTestTags,
  removeTestTags,
  updateTestTags,
  exists
};
