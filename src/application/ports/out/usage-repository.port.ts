import type { Usage } from '@/domain/entities/usage.entity';

export interface UsageRepositoryPort {
  save(usage: Usage): void | Promise<void>;
  getAll(): Usage[] | Promise<Usage[]>;
}
