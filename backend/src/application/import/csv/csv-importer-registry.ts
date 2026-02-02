import type { BankCsvImporter } from './bank-csv-importer.interface.js';
import { CbaAuCsvImporter } from './cba-au-csv-importer.js';
import { GenericMappedCsvImporter } from './generic-mapped-csv-importer.js';
import { QifImporter } from '../qif/qif-importer.js';

export class CsvImporterRegistry {
  private readonly importers: BankCsvImporter[];

  constructor() {
    this.importers = [new CbaAuCsvImporter(), new QifImporter(), new GenericMappedCsvImporter()];
  }

  detect(headers: string[] | null, sampleRows: string[][]): BankCsvImporter {
    if (this.importers.length === 0) {
      throw new Error('No CSV importers registered');
    }
    const match = this.importers.find((importer) => importer.canHandle(headers, sampleRows));
    return match ?? this.importers.at(-1)!;
  }

  resolve(formatPreset: string | undefined, headers: string[] | null, sampleRows: string[][]): BankCsvImporter {
    const normalizedPreset = formatPreset?.trim().toLowerCase();
    if (normalizedPreset) {
      const match = this.importers.find((importer) => importer.name.toLowerCase() === normalizedPreset);
      if (match) return match;

      if (normalizedPreset === 'cba-au') {
        const cbaImporter = this.importers.find((importer) => importer instanceof CbaAuCsvImporter);
        if (cbaImporter) return cbaImporter;
      }

      if (normalizedPreset === 'qif') {
        const qifImporter = this.importers.find((importer) => importer instanceof QifImporter);
        if (qifImporter) return qifImporter;
      }

      if (normalizedPreset === 'custom') {
        const mappedImporter = this.importers.find((importer) => importer instanceof GenericMappedCsvImporter);
        if (mappedImporter) return mappedImporter;
      }
    }

    return this.detect(headers, sampleRows);
  }
}
