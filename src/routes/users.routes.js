import { Router } from 'express';
import {
  createUser,
  getAllUsers,
  resetUserPassword,
  updateUser,
  deleteUser,
} from '../controllers/users.controller.js';
import {
  requireAuth,
  attachOrganizationContext,
} from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, attachOrganizationContext, getAllUsers);
router.post('/', requireAuth, attachOrganizationContext, createUser);
router.put('/:id', requireAuth, attachOrganizationContext, updateUser);
router.post('/:id/reset-password', requireAuth, attachOrganizationContext, resetUserPassword);
router.delete('/:id', requireAuth, attachOrganizationContext, deleteUser);

export default router;