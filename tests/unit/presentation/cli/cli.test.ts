import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { createCli } from '../../../../src/presentation/cli/cli';

describe('CLI builder unit test', () => {
  it('should register each supplied subcommand', () => {
    const command = new Command('sample').description('Sample subcommand');
    const cli = createCli([command]);

    expect(cli.commands).toContain(command);
    expect(cli.name()).toBe('hn-crawler');
  });

  it('should preserve the root help and version options', () => {
    const cli = createCli([]);

    expect(cli.options.some((option) => option.short === '-V')).toBe(true);
    expect(cli.options.some((option) => option.long === '--version')).toBe(
      true
    );
    expect(cli.version()).toBe('1.0.0');
  });
});
