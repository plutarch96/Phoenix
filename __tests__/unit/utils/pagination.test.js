const {
  parsePaginationParams,
  createPaginationMeta,
  createPaginatedResponse
} = require('../../../server/utils/pagination');

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should use defaults when no params provided', () => {
      const result = parsePaginationParams({}, 50);

      expect(result).toEqual({
        page: 1,
        limit: 50,
        offset: 0
      });
    });

    it('should parse page and limit from query', () => {
      const query = { page: '3', limit: '25' };
      const result = parsePaginationParams(query);

      expect(result).toEqual({
        page: 3,
        limit: 25,
        offset: 50 // (3-1) * 25
      });
    });

    it('should handle invalid page numbers', () => {
      const query = { page: 'invalid', limit: '10' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should use custom default limit', () => {
      const result = parsePaginationParams({}, 100);

      expect(result.limit).toBe(100);
    });

    it('should calculate correct offset', () => {
      const testCases = [
        { page: 1, limit: 10, expectedOffset: 0 },
        { page: 2, limit: 10, expectedOffset: 10 },
        { page: 5, limit: 20, expectedOffset: 80 },
        { page: 10, limit: 50, expectedOffset: 450 }
      ];

      testCases.forEach(({ page, limit, expectedOffset }) => {
        const query = { page: page.toString(), limit: limit.toString() };
        const result = parsePaginationParams(query);

        expect(result.offset).toBe(expectedOffset);
      });
    });
  });

  describe('createPaginationMeta', () => {
    it('should create correct metadata for first page', () => {
      const result = createPaginationMeta(1, 10, 100);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPrevPage: false
      });
    });

    it('should create correct metadata for middle page', () => {
      const result = createPaginationMeta(5, 10, 100);

      expect(result).toEqual({
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPrevPage: true
      });
    });

    it('should create correct metadata for last page', () => {
      const result = createPaginationMeta(10, 10, 100);

      expect(result).toEqual({
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNextPage: false,
        hasPrevPage: true
      });
    });

    it('should handle partial last page', () => {
      const result = createPaginationMeta(3, 10, 25);

      expect(result).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true
      });
    });

    it('should handle empty results', () => {
      const result = createPaginationMeta(1, 10, 0);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    it('should handle single page of results', () => {
      const result = createPaginationMeta(1, 50, 10);

      expect(result).toEqual({
        page: 1,
        limit: 50,
        total: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create properly formatted response', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = createPaginatedResponse(data, 1, 10, 30);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 30,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false
      });
    });

    it('should handle empty data array', () => {
      const result = createPaginatedResponse([], 1, 10, 0);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
