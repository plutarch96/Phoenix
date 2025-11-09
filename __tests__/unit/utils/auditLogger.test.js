const { logAction } = require('../../../server/utils/auditLogger');

// Mock database
jest.mock('../../../server/db/database');
const db = require('../../../server/db/database');

describe('Audit Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.run = jest.fn((query, params, callback) => {
      if (callback) callback(null);
    });
  });

  describe('logAction', () => {
    it('should log action with all parameters', () => {
      const userId = 1;
      const action = 'CREATE';
      const entityType = 'test';
      const entityId = 123;
      const details = { name: 'Test Name' };

      logAction(userId, action, entityType, entityId, details);

      expect(db.run).toHaveBeenCalled();
      const [query, params] = db.run.mock.calls[0];

      expect(query).toContain('INSERT INTO audit_logs');
      expect(params).toContain(userId);
      expect(params).toContain(action);
      expect(params).toContain(entityType);
      expect(params).toContain(entityId);
      expect(params).toContain(JSON.stringify(details));
    });

    it('should log action without details', () => {
      const userId = 1;
      const action = 'DELETE';
      const entityType = 'client';
      const entityId = 456;

      logAction(userId, action, entityType, entityId);

      expect(db.run).toHaveBeenCalled();
      const [query, params] = db.run.mock.calls[0];

      expect(params).toHaveLength(5);
      expect(params[4]).toBeNull();
    });

    it('should handle database errors gracefully', () => {
      db.run = jest.fn((query, params, callback) => {
        if (callback) callback(new Error('Database error'));
      });

      // Should not throw
      expect(() => {
        logAction(1, 'UPDATE', 'test', 1, {});
      }).not.toThrow();
    });

    it('should handle missing callback', () => {
      db.run = jest.fn((query, params) => {
        // No callback
      });

      // Should not throw
      expect(() => {
        logAction(1, 'UPDATE', 'test', 1, {});
      }).not.toThrow();
    });

    it('should serialize complex details object', () => {
      const complexDetails = {
        nested: {
          value: 123,
          array: [1, 2, 3]
        },
        string: 'test'
      };

      logAction(1, 'UPDATE', 'project', 1, complexDetails);

      const [, params] = db.run.mock.calls[0];
      const serializedDetails = params[4];

      expect(typeof serializedDetails).toBe('string');
      expect(JSON.parse(serializedDetails)).toEqual(complexDetails);
    });

    it('should log different action types correctly', () => {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

      actions.forEach(action => {
        db.run.mockClear();
        logAction(1, action, 'test', 1);

        const [, params] = db.run.mock.calls[0];
        expect(params[1]).toBe(action);
      });
    });

    it('should log different entity types correctly', () => {
      const entityTypes = ['test', 'client', 'project', 'calibration', 'user'];

      entityTypes.forEach(entityType => {
        db.run.mockClear();
        logAction(1, 'CREATE', entityType, 1);

        const [, params] = db.run.mock.calls[0];
        expect(params[2]).toBe(entityType);
      });
    });
  });
});
