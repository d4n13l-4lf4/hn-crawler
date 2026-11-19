import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCli } from '@/presentation/cli/cli';

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8')
) as { version: string };

describe('CLI builder unit test', () => {
  it('should register each supplied subcommand', () => {
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
  ])('should $should when $when', ({ expectedVersion }) => {
    const cli = createCli([]);

    expect(cli.options.some((option) => option.short === '-V')).toBe(true);
    expect(cli.options.some((option) => option.long === '--version')).toBe(
      true
    );
    expect(cli.version()).toBe(expectedVersion);
  });
});
