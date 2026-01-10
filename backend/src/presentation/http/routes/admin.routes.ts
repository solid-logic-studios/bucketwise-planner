import { Router } from 'express';
import { AdminExportController } from '../controllers/admin.export.controller.js';

export function buildAdminRouter(controller: AdminExportController): Router {
  const router = Router();

  // Temporary export endpoint for full JSON backup
  router.post(
    '/export-data',
    controller.asyncHandler((req, res) => controller.exportAll(req, res))
  );

  return router;
}
