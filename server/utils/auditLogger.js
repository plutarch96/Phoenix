const db = require('../db/database');

/**
 * Log a user action to the audit log
 * @param {Object} params - Audit log parameters
 * @param {number} params.userId - ID of the user performing the action
 * @param {string} params.username - Username of the user
 * @param {string} params.action - Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')
 * @param {string} params.entityType - Type of entity affected (e.g., 'test', 'calibration', 'client')
 * @param {number} params.entityId - ID of the entity affected
 * @param {Object|string} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the user
 */
const logAction = (params) => {
  const {
    userId,
    username,
    action,
    entityType = null,
    entityId = null,
    details = null,
    ipAddress = null
  } = params;

  const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;

  db.run(
    `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, username, action, entityType, entityId, detailsStr, ipAddress],
    (err) => {
      if (err) {
        console.error('Error logging audit action:', err);
      }
    }
  );
};

module.exports = { logAction };
