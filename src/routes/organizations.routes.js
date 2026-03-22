import { Router } from 'express';

import {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
  addOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
} from '../controllers/organizations.controller.js';

import {
  requireAuth,
  requireGlobalRole,
  attachOrganizationContext,
  requireOrganizationRole,
} from '../middlewares/auth.middleware.js';

const router = Router();

/*
SUPER ADMIN
gestion globale des organisations
*/

router.get(
  '/',
  requireAuth,
  requireGlobalRole('super_admin'),
  listOrganizations
);

router.post(
  '/',
  requireAuth,
  requireGlobalRole('super_admin'),
  createOrganization
);

router.patch(
  '/:organizationId',
  requireAuth,
  requireGlobalRole('super_admin'),
  updateOrganization
);

router.delete(
  '/:organizationId',
  requireAuth,
  requireGlobalRole('super_admin'),
  deleteOrganization
);

/*
MEMBRES ORGANISATION
*/

router.get(
  '/:organizationId/members',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin', 'manager'),
  getOrganizationMembers
);

router.post(
  '/:organizationId/members',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin'),
  addOrganizationMember
);

router.patch(
  '/:organizationId/members/:userId',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin'),
  updateOrganizationMemberRole
);

router.delete(
  '/:organizationId/members/:userId',
  requireAuth,
  attachOrganizationContext,
  requireOrganizationRole('admin'),
  removeOrganizationMember
);

export default router;