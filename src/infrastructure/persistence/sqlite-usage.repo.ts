// SQLite usage repository

import { UsageRepoPort } from '../../application/ports/usage-repo.port';

export class SqliteUsageRepo implements UsageRepoPort {
  async storeUsage(_command: string, _durationMs: number): Promise<void> {
    // Placeholder - will be implemented in future stories
  }
}
