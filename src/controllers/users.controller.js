import bcrypt from 'bcrypt';
import { pool } from '../db.js';

function isSuperAdmin(req) {
  return req.auth?.globalRole === 'super_admin';
}

function isOrgAdmin(req) {
  return req.organization?.role === 'admin';
}

function canManageUsers(req) {
  return isSuperAdmin(req) || isOrgAdmin(req);
}

function normalizeUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    global_role: row.global_role,
    organization_role: row.organization_role,
    organization_id: row.organization_id,
    organization_code: row.organization_code,
    organization_name: row.organization_name,
    is_active: row.is_active,
    must_change_password: row.must_change_password,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

function ensureOrganization(req, res) {
  if (!req.organization?.id) {
    res.status(400).json({ message: 'Contexte organisation manquant' });
    return null;
  }
  return req.organization.id;
}

async function getOrganizationById(id, client = pool) {
  const result = await client.query(
    `SELECT id, code, name, is_active
     FROM organizations
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] ?? null;
}

async function getTargetUserWithOrg(userId, client = pool) {
  const result = await client.query(
    `SELECT
       u.id,
       u.name,
       u.global_role,
       u.is_active,
       u.must_change_password,
       u.created_by,
       u.created_at,
       om.organization_id,
       om.role AS organization_role,
       o.code AS organization_code,
       o.name AS organization_name
     FROM users u
     JOIN organization_members om ON om.user_id = u.id
     JOIN organizations o ON o.id = om.organization_id
     WHERE u.id = $1
     ORDER BY om.assigned_at ASC, o.name ASC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

async function countActiveSuperAdmins(client = pool) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM users
     WHERE global_role = 'super_admin'
       AND is_active = TRUE`
  );

  return Number(result.rows[0]?.total ?? 0);
}

async function countActiveOrgAdmins(organizationId, client = pool) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1
       AND om.role = 'admin'
       AND u.is_active = TRUE`,
    [organizationId]
  );

  return Number(result.rows[0]?.total ?? 0);
}

async function userBelongsToOrganization(userId, organizationId, client = pool) {
  const result = await client.query(
    `SELECT 1
     FROM organization_members
     WHERE user_id = $1
       AND organization_id = $2
     LIMIT 1`,
    [userId, organizationId]
  );

  return result.rowCount > 0;
}

export async function getAllUsers(req, res) {
  try {
    const currentOrgId = ensureOrganization(req, res);
    if (!currentOrgId) return;

    if (!canManageUsers(req)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const requestedOrgId = String(req.query.organizationId ?? '').trim();
    const effectiveOrgId = isSuperAdmin(req)
      ? (requestedOrgId || String(currentOrgId))
      : String(currentOrgId);

    const org = await getOrganizationById(effectiveOrgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation introuvable' });
    }

    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.global_role,
         u.is_active,
         u.must_change_password,
         u.created_by,
         u.created_at,
         om.organization_id,
         om.role AS organization_role,
         o.code AS organization_code,
         o.name AS organization_name
       FROM users u
       JOIN organization_members om ON om.user_id = u.id
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.organization_id = $1
       ORDER BY u.name ASC`,
      [effectiveOrgId]
    );

    return res.json(result.rows.map(normalizeUserRow));
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function createUser(req, res) {
  try {
    const currentOrgId = ensureOrganization(req, res);
    if (!currentOrgId) return;

    if (!canManageUsers(req)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const {
      name,
      password,
      globalRole,
      organizationRole = 'agent',
      organizationId,
      mustChangePassword = true,
    } = req.body ?? {};

    if (!name || !password) {
      return res.status(400).json({ message: 'Nom et mot de passe requis' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    const targetGlobalRole = globalRole ?? 'staff';
    const targetOrganizationRole = organizationRole ?? 'agent';

    if (!['super_admin', 'staff'].includes(targetGlobalRole)) {
      return res.status(400).json({ message: 'Rôle global invalide' });
    }

    if (!['admin', 'manager', 'agent'].includes(targetOrganizationRole)) {
      return res.status(400).json({ message: 'Rôle organisation invalide' });
    }

    if (targetGlobalRole === 'super_admin' && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: 'Seul un super admin peut créer un super admin',
      });
    }

    const targetOrgId = isSuperAdmin(req)
      ? String(organizationId || currentOrgId)
      : String(currentOrgId);

    const org = await getOrganizationById(targetOrgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation introuvable' });
    }

    const exists = await pool.query(
      `SELECT id
       FROM users
       WHERE name = $1
       LIMIT 1`,
      [String(name).trim()]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({ message: 'Nom déjà utilisé' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const hash = await bcrypt.hash(String(password), 12);

      const userResult = await client.query(
        `INSERT INTO users (
           name,
           password_hash,
           global_role,
           is_active,
           must_change_password,
           created_by
         )
         VALUES ($1, $2, $3, TRUE, $4, $5)
         RETURNING id, name, global_role, is_active, must_change_password, created_by, created_at`,
        [
          String(name).trim(),
          hash,
          targetGlobalRole,
          Boolean(mustChangePassword),
          req.auth.userId,
        ]
      );

      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO organization_members (
           organization_id,
           user_id,
           role,
           assigned_at,
           assigned_by
         )
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (organization_id, user_id)
         DO UPDATE SET
           role = EXCLUDED.role,
           assigned_at = NOW(),
           assigned_by = EXCLUDED.assigned_by`,
        [targetOrgId, user.id, targetOrganizationRole, req.auth.userId]
      );

      await client.query('COMMIT');

      const created = await getTargetUserWithOrg(user.id);
      return res.status(201).json(normalizeUserRow(created));
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function updateUser(req, res) {
  try {
    const currentOrgId = ensureOrganization(req, res);
    if (!currentOrgId) return;

    if (!canManageUsers(req)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const { id } = req.params;
    const {
      globalRole,
      organizationRole,
      isActive,
      mustChangePassword,
      organizationId,
    } = req.body ?? {};

    const target = await getTargetUserWithOrg(id);

    if (!target) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const targetInCurrentOrg = await userBelongsToOrganization(id, currentOrgId);

    if (!isSuperAdmin(req) && !targetInCurrentOrg) {
      return res.status(403).json({ message: 'Accès interdit à cet utilisateur' });
    }

    if (!isSuperAdmin(req) && target.global_role === 'super_admin') {
      return res.status(403).json({
        message: 'Un admin d’organisation ne peut pas modifier un super admin',
      });
    }

    const nextGlobalRole = globalRole ?? target.global_role;
    const nextOrganizationRole = organizationRole ?? target.organization_role;
    const nextIsActive =
      typeof isActive === 'boolean' ? isActive : target.is_active;
    const nextMustChange =
      typeof mustChangePassword === 'boolean'
        ? mustChangePassword
        : target.must_change_password;

    const nextOrganizationId = isSuperAdmin(req)
      ? String(organizationId || target.organization_id)
      : String(currentOrgId);

    if (!['super_admin', 'staff'].includes(nextGlobalRole)) {
      return res.status(400).json({ message: 'Rôle global invalide' });
    }

    if (!['admin', 'manager', 'agent'].includes(nextOrganizationRole)) {
      return res.status(400).json({ message: 'Rôle organisation invalide' });
    }

    if (!isSuperAdmin(req) && nextGlobalRole !== target.global_role) {
      return res.status(403).json({
        message: 'Seul un super admin peut modifier le rôle global',
      });
    }

    if (!isSuperAdmin(req) && nextOrganizationId !== String(currentOrgId)) {
      return res.status(403).json({
        message: 'Seul un super admin peut changer d’organisation',
      });
    }

    if (
      !isSuperAdmin(req) &&
      String(target.id) === String(req.auth.userId) &&
      nextOrganizationRole !== 'admin'
    ) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas vous retirer votre rôle admin',
      });
    }

    const targetOrg = await getOrganizationById(nextOrganizationId);
    if (!targetOrg) {
      return res.status(404).json({ message: 'Organisation cible introuvable' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const isCurrentlySuperAdmin = target.global_role === 'super_admin';
      const isStillSuperAdmin = nextGlobalRole === 'super_admin';

      if (isCurrentlySuperAdmin && !isStillSuperAdmin) {
        const total = await countActiveSuperAdmins(client);
        if (total <= 1) {
          throw new Error('Impossible de rétrograder le dernier super admin');
        }
      }

      const sourceOrgId = String(target.organization_id);
      const sourceOrgRole = target.organization_role;
      const movingToAnotherOrg = sourceOrgId !== String(nextOrganizationId);

      const sourceAdminImpacted =
        sourceOrgRole === 'admin' &&
        (movingToAnotherOrg || nextOrganizationRole !== 'admin' || nextIsActive === false);

      if (sourceAdminImpacted) {
        const sourceAdminCount = await countActiveOrgAdmins(sourceOrgId, client);
        if (sourceAdminCount <= 1) {
          throw new Error(
            'Impossible de retirer le dernier admin actif de l’organisation source'
          );
        }
      }

      await client.query(
        `UPDATE users
         SET global_role = $2,
             is_active = $3,
             must_change_password = $4
         WHERE id = $1`,
        [id, nextGlobalRole, nextIsActive, nextMustChange]
      );

      const existingTargetMembership = await client.query(
        `SELECT organization_id, user_id
         FROM organization_members
         WHERE organization_id = $1
           AND user_id = $2
         LIMIT 1`,
        [nextOrganizationId, id]
      );

      if (existingTargetMembership.rowCount > 0) {
        await client.query(
          `UPDATE organization_members
           SET role = $3,
               assigned_at = NOW(),
               assigned_by = $4
           WHERE organization_id = $1
             AND user_id = $2`,
          [nextOrganizationId, id, nextOrganizationRole, req.auth.userId]
        );

        if (sourceOrgId !== String(nextOrganizationId)) {
          await client.query(
            `DELETE FROM organization_members
             WHERE organization_id = $1
               AND user_id = $2`,
            [sourceOrgId, id]
          );
        }
      } else {
        await client.query(
          `UPDATE organization_members
           SET organization_id = $2,
               role = $3,
               assigned_at = NOW(),
               assigned_by = $4
           WHERE organization_id = $5
             AND user_id = $1`,
          [id, nextOrganizationId, nextOrganizationRole, req.auth.userId, sourceOrgId]
        );
      }

      await client.query('COMMIT');

      const updated = await getTargetUserWithOrg(id);
      return res.json(normalizeUserRow(updated));
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: e.message || 'Erreur mise à jour utilisateur',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function resetUserPassword(req, res) {
  try {
    const currentOrgId = ensureOrganization(req, res);
    if (!currentOrgId) return;

    if (!canManageUsers(req)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const { id } = req.params;
    const { password } = req.body ?? {};

    if (!password) {
      return res.status(400).json({ message: 'Nouveau mot de passe requis' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    const target = await getTargetUserWithOrg(id);

    if (!target) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const targetInCurrentOrg = await userBelongsToOrganization(id, currentOrgId);

    if (!isSuperAdmin(req) && !targetInCurrentOrg) {
      return res.status(403).json({ message: 'Accès interdit à cet utilisateur' });
    }

    if (!isSuperAdmin(req) && target.global_role === 'super_admin') {
      return res.status(403).json({
        message: 'Un admin d’organisation ne peut pas réinitialiser un super admin',
      });
    }

    const hash = await bcrypt.hash(String(password), 12);

    await pool.query(
      `UPDATE users
       SET password_hash = $2,
           must_change_password = TRUE
       WHERE id = $1`,
      [id, hash]
    );

    return res.status(204).send();
  } catch (error) {
    console.error('resetUserPassword error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function deleteUser(req, res) {
  try {
    const currentOrgId = ensureOrganization(req, res);
    if (!currentOrgId) return;

    if (!canManageUsers(req)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const { id } = req.params;

    const target = await getTargetUserWithOrg(id);

    if (!target) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const targetInCurrentOrg = await userBelongsToOrganization(id, currentOrgId);

    if (!isSuperAdmin(req) && !targetInCurrentOrg) {
      return res.status(403).json({ message: 'Accès interdit à cet utilisateur' });
    }

    if (String(target.id) === String(req.auth.userId)) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    if (!isSuperAdmin(req) && target.global_role === 'super_admin') {
      return res.status(403).json({
        message: 'Un admin d’organisation ne peut pas supprimer un super admin',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (target.global_role === 'super_admin') {
        const total = await countActiveSuperAdmins(client);
        if (total <= 1) {
          throw new Error('Impossible de supprimer le dernier super admin');
        }
      }

      if (target.organization_role === 'admin' && target.is_active) {
        const orgAdminCount = await countActiveOrgAdmins(target.organization_id, client);
        if (orgAdminCount <= 1) {
          throw new Error(
            'Impossible de supprimer le dernier admin actif de cette organisation'
          );
        }
      }

      await client.query(
        `DELETE FROM organization_members
         WHERE user_id = $1`,
        [id]
      );

      await client.query(
        `DELETE FROM users
         WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      return res.status(204).send();
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: e.message || 'Erreur suppression utilisateur',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}