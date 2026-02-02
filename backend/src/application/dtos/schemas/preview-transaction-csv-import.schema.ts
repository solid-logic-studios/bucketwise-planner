import { z } from 'zod';

export const previewTransactionCsvImportSchema = z.object({
  formatPreset: z.string().optional(),
  mapping: z
    .object({
      delimiter: z.enum([',', ';', '\t', '|']).optional(),
      hasHeader: z.boolean().optional(),
      dateColumn: z.union([z.string().min(1), z.number().int().nonnegative()]),
      amountColumn: z.union([z.string().min(1), z.number().int().nonnegative()]),
      descriptionColumn: z.union([z.string().min(1), z.number().int().nonnegative()]),
      balanceColumn: z.union([z.string().min(1), z.number().int().nonnegative()]).optional(),
      dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY', 'AUTO']).optional(),
      decimalSeparator: z.enum(['.', ',']).optional(),
      thousandsSeparator: z.enum([',', '.', ' ', '']).optional(),
    })
    .optional(),
  defaultBucket: z.string().optional(),
  qifDateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YY/MM/DD']).optional(),
});

export type PreviewTransactionCsvImportRequest = z.infer<typeof previewTransactionCsvImportSchema>;
