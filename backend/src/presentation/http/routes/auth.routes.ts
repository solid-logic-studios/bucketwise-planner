import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

export function buildAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/signup', controller.asyncHandler((req, res) => controller.signup(req, res)));
  router.post('/login', controller.asyncHandler((req, res) => controller.login(req, res)));
  router.post('/logout', controller.asyncHandler((req, res) => controller.logout(req, res)));
  router.post('/refresh', controller.asyncHandler((req, res) => controller.refresh(req, res)));

  return router;
}
