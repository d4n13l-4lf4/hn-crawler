import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import type { Usage } from '@/domain/entities/usage.entity';

export class InMemoryUsageRepository implements UsageRepositoryPort {
  private readonly records: Usage[] = [];

  save(usage: Usage): void {
    this.records.push(usage);
  }

  getAll(): Usage[] {
    return [...this.records];
  }
}
