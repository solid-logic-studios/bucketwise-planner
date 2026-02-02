import { Router } from 'express';
import multer from 'multer';
import { TransactionImportController } from '../controllers/transaction-import.controller.js';
import { validationMiddleware } from '../middlewares/validation.middleware.js';
import { commitTransactionCsvImportSchema } from '../../../application/dtos/schemas/commit-transaction-csv-import.schema.js';

export function buildTransactionImportRouter(
  controller: TransactionImportController
): Router {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  router.post(
    '/import/csv/preview',
    upload.single('file'),
    controller.asyncHandler((req, res) => controller.previewCsv(req, res))
  );

  router.post(
    '/import/csv/commit',
    validationMiddleware(commitTransactionCsvImportSchema),
    controller.asyncHandler((req, res) => controller.commitCsv(req, res))
  );

  return router;
}
