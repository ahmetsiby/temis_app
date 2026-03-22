import { Router } from 'express';
import {
  createClient,
  deleteClient,
  getAllClients,
  updateClient,
  getClientAuditLogs
} from '../controllers/clients.controller.js';
import {
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole,
  requireClientAdmin,
} from '../middlewares/auth.middleware.js';

const router = Router();

router.get(
  '/audit',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager', 'agent'),
  getClientAuditLogs
);

router.get(
  '/',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager', 'agent'),
  getAllClients
);

router.post(
  '/',
  requireAuth,
  attachOrganizationContext,
  requireClientAdmin,
  createClient
);

router.put(
  '/:id',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager', 'agent'),
  updateClient
);

router.delete(
  '/:id',
  requireAuth,
  attachOrganizationContext,
  requireClientAdmin,
  deleteClient
);


export default router;