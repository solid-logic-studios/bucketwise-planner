import type { Request, RequestHandler, Response } from 'express';
import multer from 'multer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { upsertProfileSchema } from '../../../application/dtos/schemas/profile.schema.js';
import { GetProfileUseCase } from '../../../application/use-cases/get-profile.use-case.js';
import { UpsertProfileUseCase } from '../../../application/use-cases/upsert-profile.use-case.js';
import { User } from '../../../domain/model/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BaseController } from './base.controller.js';

export class ProfileController extends BaseController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly upsertProfileUseCase: UpsertProfileUseCase,
    private readonly userRepo: UserRepository
  ) {
    super();
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const profile = await this.getProfileUseCase.execute({ userId });
    this.sendSuccess(res, profile);
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const validated = upsertProfileSchema.parse(req.body);
    const result = await this.upsertProfileUseCase.execute({
      userId,
      fortnightlyIncomeCents: validated.fortnightlyIncomeCents,
      defaultFireExtinguisherPercent: validated.defaultFireExtinguisherPercent,
      fixedExpenses: validated.fixedExpenses.map(fx => ({
        id: fx.id,
        name: fx.name,
        bucket: fx.bucket,
        amountCents: fx.amountCents,
      })),
    });
    this.sendSuccess(res, result);
  }

  async getAvatar(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id as string;
    const avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');
    
    // Check for any image extension
    const extensions = ['.jpg', '.jpeg', '.png'];
    for (const ext of extensions) {
      const avatarPath = path.join(avatarDir, `${userId}${ext}`);
      if (fs.existsSync(avatarPath)) {
        const url = `/uploads/avatars/${userId}${ext}`;
        this.sendSuccess(res, { url });
        return;
      }
    }
    
    this.sendSuccess(res, { url: null });
  }

  // Multer configuration for avatar uploads
  getUploadMiddleware(): RequestHandler {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.resolve(process.cwd(), 'uploads', 'avatars');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const userId = (req as any).user.id as string;
        const ext = path.extname(file.originalname);
        cb(null, `${userId}${ext}`);
      },
    });

    return multer({
      storage,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
      fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PNG and JPEG images are allowed'));
        }
      },
    }).single('avatar');
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id as string;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { message: 'No file uploaded', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const ext = path.extname(file.filename);
    const url = `/uploads/avatars/${userId}${ext}`;
    this.sendSuccess(res, { url });
  }

  async getUserProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id as string;
    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
      return;
    }
    this.sendSuccess(res, { email: user.email, name: user.name });
  }

  async updateUserProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id as string;
    const updateSchema = z.object({ name: z.string().min(1).max(256) });
    const validated = updateSchema.parse(req.body);
    
    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    const updated = new User({
      id: user.id,
      email: user.email,
      name: validated.name,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.userRepo.updateUser(updated);
    this.sendSuccess(res, { email: saved.email, name: saved.name });
  }
}
