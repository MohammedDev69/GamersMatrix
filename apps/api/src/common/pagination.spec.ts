import { pageMeta, parsePage } from './pagination';

describe('pagination helpers', () => {
  it('parses page bounds', () => {
    expect(parsePage({ page: '2', pageSize: '10' })).toEqual({
      page: 2,
      pageSize: 10,
      skip: 10,
      take: 10,
    });
  });

  it('caps pageSize at 100', () => {
    expect(parsePage({ pageSize: '999' }).pageSize).toBe(100);
  });

  it('builds meta', () => {
    expect(pageMeta(45, 2, 20)).toEqual({
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
      hasMore: true,
    });
  });
});
