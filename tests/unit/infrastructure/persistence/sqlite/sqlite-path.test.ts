import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mkdirSyncMock, envPathsMock } = vi.hoisted(() => ({
  mkdirSyncMock: vi.fn(),
  envPathsMock: vi.fn(),
}));

vi.mock('node:fs', () => ({ mkdirSync: mkdirSyncMock }));
import { getSqlitePath } from '@/infrastructure/persistence/sqlite/sqlite-path';

vi.mock('env-paths', () => ({ default: envPathsMock }));

describe('getSqlitePath', () => {
  beforeEach(() => {
    mkdirSyncMock.mockReset();
    envPathsMock.mockReset();
    envPathsMock.mockReturnValue({ data: '/user/data/hn-crawler-nodejs' });
  });

  const cases = [
    {
      should:
        'resolve the default database path from the application data directory',
      override: undefined,
      expectedPath: '/user/data/hn-crawler-nodejs/usage.sqlite',
      expectedDirectory: '/user/data/hn-crawler-nodejs',
      shouldResolveDefault: true,
    },
    {
      should: 'use the explicit database path override',
      override: '/tmp/hn-crawler-test.sqlite',
      expectedPath: '/tmp/hn-crawler-test.sqlite',
      expectedDirectory: '/tmp',
      shouldResolveDefault: false,
    },
  ];

  it.each(cases)(
    'should $should',
    async ({
      override,
      expectedPath,
      expectedDirectory,
      shouldResolveDefault,
    }) => {
      const result = await getSqlitePath(override);

      expect(result).toBe(expectedPath);
      expect(mkdirSyncMock).toHaveBeenCalledWith(expectedDirectory, {
        recursive: true,
      });
      expect(envPathsMock).toHaveBeenCalledTimes(shouldResolveDefault ? 1 : 0);
      if (shouldResolveDefault) {
        expect(envPathsMock).toHaveBeenCalledWith('hn-crawler');
      }
    }
  );
});
