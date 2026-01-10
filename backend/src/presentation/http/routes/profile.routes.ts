import { Router } from 'express';
import { upsertProfileSchema } from '../../../application/dtos/schemas/profile.schema.js';
import { ProfileController } from '../controllers/profile.controller.js';
import { validationMiddleware } from '../middlewares/validation.middleware.js';

export function buildProfileRouter(controller: ProfileController): Router {
  const router = Router();

  router.get(
    '/',
    controller.asyncHandler((req, res) => controller.getProfile(req, res))
  );

  router.put(
    '/',
    validationMiddleware(upsertProfileSchema),
    controller.asyncHandler((req, res) => controller.updateProfile(req, res))
  );

  // Avatar endpoints
  router.get(
    '/avatar',
    controller.asyncHandler((req, res) => controller.getAvatar(req, res))
  );

  router.post(
    '/avatar',
    controller.getUploadMiddleware(),
    controller.asyncHandler((req, res) => controller.uploadAvatar(req, res))
  );

  // User profile endpoints
  router.get(
    '/user',
    controller.asyncHandler((req, res) => controller.getUserProfile(req, res))
  );

  router.put(
    '/user',
    controller.asyncHandler((req, res) => controller.updateUserProfile(req, res))
  );

  return router;
}
