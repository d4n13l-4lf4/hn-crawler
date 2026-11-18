import { existsSync, readdirSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

import { hasMigrationFiles } from '@/infrastructure/persistence/sqlite/migration-files';

describe('hasMigrationFiles', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
    vi.mocked(readdirSync).mockReset();
  });

  const cases = [
    {
      should: 'return true when a migration SQL file is present',
      directoryExists: true,
      entries: [
        { name: '20261118174132_friendly_zombie', isDirectory: () => true },
      ],
      migrationExists: true,
      expected: true,
    },
    {
      should: 'return false when no migration SQL file is present',
      directoryExists: true,
      entries: [
        { name: '20261118174132_friendly_zombie', isDirectory: () => true },
      ],
      migrationExists: false,
      expected: false,
    },
    {
      should: 'return false when the migrations directory is missing',
      directoryExists: false,
      entries: [],
      migrationExists: false,
      expected: false,
    },
  ];

  it.each(cases)(
    'should $should',
    ({ directoryExists, entries, migrationExists, expected }) => {
      vi.mocked(existsSync)
        .mockReturnValueOnce(directoryExists)
        .mockReturnValue(migrationExists);
      vi.mocked(readdirSync).mockReturnValue(entries as never);

      const result = hasMigrationFiles('/app/drizzle/migrations');

      expect(result).toBe(expected);
      expect(existsSync).toHaveBeenCalledWith('/app/drizzle/migrations');
      expect(readdirSync).toHaveBeenCalledTimes(directoryExists ? 1 : 0);
      if (directoryExists) {
        expect(readdirSync).toHaveBeenCalledWith('/app/drizzle/migrations', {
          withFileTypes: true,
        });
      }
    }
  );
});
