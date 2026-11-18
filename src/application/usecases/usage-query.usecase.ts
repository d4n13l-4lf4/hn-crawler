import type { UsageQueryPort } from '@/application/ports/in/usage-query.port';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import type { Usage } from '@/domain/entities/usage.entity';

export class UsageQueryUseCase implements UsageQueryPort {
  constructor(private readonly usageRepository: UsageRepositoryPort) {}

  getAll(): Usage[] | Promise<Usage[]> {
    return this.usageRepository.getAll();
  }
}
