import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'Token manquant',
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        message: 'Format Authorization invalide',
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({
        message: 'Token invalide ou expiré',
      });
    }

    const userId = payload.sub;

    if (!userId) {
      return res.status(401).json({
        message: 'Token invalide',
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, global_role, is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur introuvable',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: 'Compte désactivé',
      });
    }

    req.auth = {
      userId: user.id,
      name: user.name,
      globalRole: user.global_role,
    };

    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export function requireGlobalRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Non authentifié',
      });
    }

    if (!allowedRoles.includes(req.auth.globalRole)) {
      return res.status(403).json({
        message: 'Accès refusé',
      });
    }

    next();
  };
}

export async function attachOrganizationContext(req, res, next) {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({
        message: 'Non authentifié',
      });
    }

    const organizationId =
      req.headers['x-organization-id'] ||
      req.params?.organizationId ||
      req.query?.organizationId ||
      req.body?.organizationId;

    if (!organizationId) {
      req.organization = null;
      return next();
    }

    // Super admin = accès à toute organisation active
    if (req.auth.globalRole === 'super_admin') {
      const orgResult = await pool.query(
        `
        SELECT id, code, name, is_active
        FROM organizations
        WHERE id = $1
        LIMIT 1
        `,
        [organizationId]
      );

      const org = orgResult.rows[0];

      if (!org) {
        return res.status(404).json({
          message: 'Organisation introuvable',
        });
      }

      if (!org.is_active) {
        return res.status(403).json({
          message: 'Organisation désactivée',
        });
      }

      req.organization = {
        id: org.id,
        code: org.code,
        name: org.name,
        role: 'admin',
        isActive: org.is_active,
      };

      return next();
    }

    // Utilisateur normal = doit être membre
    const result = await pool.query(
      `
      SELECT
        om.organization_id,
        om.role,
        o.code,
        o.name,
        o.is_active
      FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = $1
        AND om.organization_id = $2
      LIMIT 1
      `,
      [req.auth.userId, organizationId]
    );

    const membership = result.rows[0];

    if (!membership) {
      return res.status(403).json({
        message: 'Accès refusé à cette organisation',
      });
    }

    if (!membership.is_active) {
      return res.status(403).json({
        message: 'Organisation désactivée',
      });
    }

    req.organization = {
      id: membership.organization_id,
      code: membership.code,
      name: membership.name,
      role: membership.role,
      isActive: membership.is_active,
    };

    next();
  } catch (error) {
    console.error('attachOrganizationContext error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export function requireOrganizationRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.organization) {
      return res.status(403).json({
        message: 'Contexte organisation manquant',
      });
    }

    if (req.auth?.globalRole === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.organization.role)) {
      return res.status(403).json({
        message: 'Accès refusé',
      });
    }

    next();
  };
}
export function requireClientAdmin(req, res, next) {

  if (!req.auth) {
    return res.status(401).json({
      message: 'Non authentifié',
    });
  }

  if (req.auth.globalRole === 'super_admin') {
    return next();
  }

  if (req.organization?.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Action réservée aux administrateurs',
  });
}