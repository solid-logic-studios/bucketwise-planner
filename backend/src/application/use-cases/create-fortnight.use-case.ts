import { ValidationError } from '../../domain/exceptions/validation-error.js';
import { Allocation } from '../../domain/model/allocation.entity.js';
import type { BarefootBucket } from '../../domain/model/barefoot-bucket.js';
import { FortnightSnapshot } from '../../domain/model/fortnight-snapshot.entity.js';
import type { FortnightSnapshotRepository } from '../../domain/repositories/fortnight-snapshot.repository.interface.js';
import { UseCase } from './base.use-case.js';

/**
 * CreateFortnightUseCase: create a new fortnight period with initial allocations
 */
interface CreateFortnightInput {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  allocations: Array<{
    bucket: BarefootBucket;
    percent: number;
  }>;
}

interface CreateFortnightOutput {
  fortnightId: string;
  success: boolean;
}

export class CreateFortnightUseCase extends UseCase<
  CreateFortnightInput,
  CreateFortnightOutput
> {
  constructor(
    private fortnightRepository: FortnightSnapshotRepository
  ) {
    super();
  }

  async execute(input: CreateFortnightInput): Promise<CreateFortnightOutput> {
    // Validate allocations sum to 1.0 (100%)
    const totalPercent = input.allocations.reduce((sum, a) => sum + a.percent, 0);
    if (Math.abs(totalPercent - 1.0) > 0.001) {
      throw new ValidationError(
        `Allocations must sum to 100%, got ${(totalPercent * 100).toFixed(2)}%`
      );
    }

    const fortnightId = crypto.randomUUID();

    // Create allocation entities
    const allocations = input.allocations.map((a) => {
      const id = crypto.randomUUID();
      return new Allocation(id, a.bucket, a.percent);
    });

    // Create and save fortnight snapshot
    const snapshot = new FortnightSnapshot(
      fortnightId,
      input.periodStart,
      input.periodEnd,
      allocations,
      [] // No transactions yet
    );

    await this.fortnightRepository.add(input.userId, snapshot);

    return {
      fortnightId,
      success: true,
    };
  }
}
