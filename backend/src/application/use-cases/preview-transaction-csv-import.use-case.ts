import { ValidationError } from '../../domain/exceptions/validation-error.js';
import type { BarefootBucket } from '../../domain/model/barefoot-bucket.js';
import { barefootBuckets } from '../../domain/model/barefoot-bucket.js';
import type { BudgetProfileRepository } from '../../domain/repositories/budget-profile.repository.interface.js';
import { CsvImporterRegistry } from '../import/csv/csv-importer-registry.js';
import { CsvMappingFactory } from '../import/csv/csv-mapping-factory.js';
import { CsvParser } from '../import/csv/csv-parser.js';
import type { BankCsvImporter } from '../import/csv/bank-csv-importer.interface.js';
import type { CsvPreviewResult, CsvMappingInput } from '../import/csv/csv-types.js';
import { UseCase } from './base.use-case.js';

export interface PreviewTransactionCsvImportRequest {
  userId: string;
  content: string;
  formatPreset?: string;
  mapping?: CsvMappingInput;
  defaultBucket?: string;
  qifDateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YY/MM/DD';
}

export class PreviewTransactionCsvImportUseCase extends UseCase<
  PreviewTransactionCsvImportRequest,
  CsvPreviewResult
> {
  constructor(private readonly profileRepository: BudgetProfileRepository) {
    super();
  }

  async execute(request: PreviewTransactionCsvImportRequest): Promise<CsvPreviewResult> {
    if (!request.content.trim()) {
      throw new ValidationError('CSV content is empty');
    }

    const profile = await this.profileRepository.getProfile(request.userId);
    const timezone = profile?.timezone ?? 'UTC';

    const defaultBucket = this.resolveDefaultBucket(request.defaultBucket);

    const mapping = CsvMappingFactory.fromInput(request.mapping);
    const registry = new CsvImporterRegistry();
    const importer = this.resolveImporter(request.formatPreset, mapping, request.content, registry);

    const importerOptions = {
      timezone,
      defaultBucket,
      ...(mapping ? { mapping } : {}),
      ...(request.mapping?.dateFormat ? { dateFormat: request.mapping.dateFormat } : {}),
      ...(request.qifDateFormat ? { qifDateFormat: request.qifDateFormat } : {}),
    };

    const rows = importer.parse(request.content, importerOptions);

    return {
      importer: importer.name,
      timezone,
      rows,
    };
  }

  private resolveDefaultBucket(value?: string): BarefootBucket {
    if (value && (barefootBuckets as readonly string[]).includes(value)) {
      return value as BarefootBucket;
    }
    return 'Daily Expenses';
  }

  private resolveImporter(
    formatPreset: string | undefined,
    mapping: ReturnType<typeof CsvMappingFactory.fromInput>,
    content: string,
    registry: CsvImporterRegistry
  ): BankCsvImporter {
    const normalizedPreset = formatPreset?.trim().toLowerCase();

    if (normalizedPreset === 'custom') {
      if (!mapping) {
        throw new ValidationError('Mapping configuration is required for mapped CSV');
      }
      return registry.resolve(formatPreset, null, []);
    }
    const sampleRows = CsvParser.parse(content, ',').rows.slice(0, 5);
    return registry.resolve(formatPreset, null, sampleRows);
  }
}
