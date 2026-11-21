import { describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8')
) as { version: string };

describe('CLI builder unit test', () => {
  it('should register each supplied subcommand', async () => {
    vi.stubGlobal('__APP_VERSION__', packageJson.version);
    const { createCli } = await import('@/presentation/cli/cli');
    const command = new Command('sample').description('Sample subcommand');
    const cli = createCli([command]);

    expect(cli.commands).toContain(command);
    expect(cli.name()).toBe('hn-crawler');
  });

  it.each([
    {
      should: 'register the package version',
      when: 'building the root command',
      expectedVersion: packageJson.version,
    },
  ])('should $should when $when', async ({ expectedVersion }) => {
    vi.stubGlobal('__APP_VERSION__', expectedVersion);
    const { createCli } = await import('@/presentation/cli/cli');
    const cli = createCli([]);

    expect(cli.options.some((option) => option.short === '-V')).toBe(true);
    expect(cli.options.some((option) => option.long === '--version')).toBe(
      true
    );
    expect(cli.version()).toBe(expectedVersion);
  });
});
