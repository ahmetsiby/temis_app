import { Router } from 'express';
import { pullSync, pushSync } from '../controllers/sync.controller.js';
import {
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole,
} from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/push',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager', 'agent'),
  pushSync
);

router.get(
  '/pull',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager', 'agent'),
  pullSync
);

export default router;