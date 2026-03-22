import { Router } from 'express';
import {
  deleteSetting,
  getSettings,
  upsertSetting,
} from '../controllers/settings.controller.js';
import {
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole,
} from '../middlewares/auth.middleware.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager', 'agent'),
  getSettings
);

router.put(
  '/',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  upsertSetting
);

router.delete(
  '/:key',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  deleteSetting
);

export default router;