import type { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { ExportDataUseCase } from '../../../application/use-cases/export-data.use-case.js';

export class AdminExportController extends BaseController {
  constructor(private readonly exportDataUseCase: ExportDataUseCase) {
    super();
  }

  async exportAll(req: Request, res: Response): Promise<void> {
    const adminSecretHeader = (req.headers['x-admin-secret'] || '') as string;
    const adminSecretEnv = process.env.ADMIN_SECRET || '';

    if (!adminSecretEnv || adminSecretHeader !== adminSecretEnv) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin secret' } });
      return;
    }

    try {
      const data = await this.exportDataUseCase.execute();
      this.sendSuccess(res, data);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
