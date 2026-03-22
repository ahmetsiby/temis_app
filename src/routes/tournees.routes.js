import { Router } from 'express';
import {
  addClientToTournee,
  createTournee,
  deleteTournee,
  getAllTournees,
  removeClientFromTournee,
  reorderTourneeClients,
  setActifTourneeClient,
  updateTournee,
} from '../controllers/tournees.controller.js';
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
  getAllTournees
);

router.post(
  '/',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  createTournee
);

router.put(
  '/:id',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  updateTournee
);

router.delete(
  '/:id',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  deleteTournee
);

router.post(
  '/:id/clients',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  addClientToTournee
);

router.delete(
  '/:id/clients/:clientId',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  removeClientFromTournee
);

router.patch(
  '/:id/clients/:clientId/actif',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  setActifTourneeClient
);

router.post(
  '/:id/reorder',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  reorderTourneeClients
);

export default router;