import type { Usage } from '@/domain/entities/usage.entity';

export interface UsageQueryPort {
  getAll(): Usage[] | Promise<Usage[]>;
}
