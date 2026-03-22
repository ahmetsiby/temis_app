import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  me,
  changePassword,
  selectOrganization
} from '../controllers/auth.controller.js';

import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

/*
AUTHENTIFICATION
*/

router.post('/login', login);

router.post('/refresh', refresh);

router.post('/logout', requireAuth, logout);

router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);
router.post('/select-organization', requireAuth, selectOrganization);

export default router;