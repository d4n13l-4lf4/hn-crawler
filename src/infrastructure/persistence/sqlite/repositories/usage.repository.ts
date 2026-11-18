import { asc, sql } from 'drizzle-orm';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { Usage } from '@/domain/entities/usage.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import type { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { usage } from '@/infrastructure/persistence/sqlite/schema/usage.schema';

type SqliteClient = ReturnType<typeof createSqliteClient>;

export class SqliteUsageRepository implements UsageRepositoryPort {
  constructor(
    private readonly client: SqliteClient,
    private readonly retentionLimit: number
  ) {}

  save(record: Usage): void {
    this.client.transaction((transaction) => {
      transaction
        .insert(usage)
        .values({
          request_id: record.request_id,
          request_timestamp: record.request_timestamp,
          applied_filters: record.applied_filters.toString(),
          duration_ms: record.duration_ms,
        })
        .run();

      transaction
        .delete(usage)
        .where(
          sql`${usage.request_id} NOT IN (
            SELECT request_id FROM usage
            ORDER BY rowid DESC
            LIMIT ${this.retentionLimit}
          )`
        )
        .run();
    });
  }

  getAll(): Usage[] {
    return this.client
      .select()
      .from(usage)
      .orderBy(asc(sql`rowid`))
      .all()
      .map(
        (record) =>
          new Usage(
            record.request_id,
            record.request_timestamp,
            AppliedFilters.fromString(record.applied_filters),
            record.duration_ms
          )
      );
  }
}
