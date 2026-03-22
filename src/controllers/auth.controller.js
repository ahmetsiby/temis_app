import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { sha256 } from '../utils/hash.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(payload) {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: `${days}d`,
  });
}

async function storeRefreshToken(userId, token) {
  const hash = sha256(token);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (
       $1,
       $2,
       NOW() + (($3 || ' days')::interval)
     )`,
    [userId, hash, String(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30)]
  );
}

async function getAccessibleOrganizations(userId, globalRole) {
  if (globalRole === 'super_admin') {
    const result = await pool.query(`
      SELECT
        id,
        code,
        name,
        is_active,
        adresse,
        ville,
        pays,
        lat,
        lng,
        phones_json
      FROM organizations
      ORDER BY name
    `);

      return result.rows.map((o) => ({
        id: o.id,
        code: o.code,
        name: o.name,
        role: 'admin',
        is_active: o.is_active,
        adresse: o.adresse ?? null,
        ville: o.ville ?? null,
        pays: o.pays ?? null,
        lat: o.lat ?? null,
        lng: o.lng ?? null,
        phones: Array.isArray(o.phones_json) ? o.phones_json : [],
      }));
  }

  const result = await pool.query(
    `
      SELECT
        o.id,
        o.code,
        o.name,
        o.is_active,
        o.adresse,
        o.ville,
        o.pays,
        o.lat,
        o.lng,
        o.phones_json,
        om.role
      FROM organization_members om
      JOIN organizations o
        ON o.id = om.organization_id
      WHERE om.user_id = $1
      ORDER BY o.name
    `,
    [userId]
  );

    return result.rows.map((o) => ({
      id: o.id,
      code: o.code,
      name: o.name,
      role: o.role,
      is_active: o.is_active,
      adresse: o.adresse ?? null,
      ville: o.ville ?? null,
      pays: o.pays ?? null,
      lat: o.lat ?? null,
      lng: o.lng ?? null,
      phones: Array.isArray(o.phones_json) ? o.phones_json : [],
    }));
}

async function getUserById(userId) {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      password_hash,
      global_role,
      is_active,
      must_change_password
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

function buildAuthResponse(user, organization, organizations, accessToken, refreshToken = null) {
  return {
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
    user: {
      id: user.id,
      name: user.name,
      globalRole: user.global_role,
      isActive: user.is_active,
      mustChangePassword: user.must_change_password,
    },
    organization,
    organizations,
  };
}

export async function login(req, res) {
  try {
    const { name, password } = req.body ?? {};
    if (!name || !password) {
      return res.status(400).json({ message: 'Nom et mot de passe requis' });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        password_hash,
        global_role,
        is_active,
        must_change_password
      FROM users
      WHERE name = $1
      LIMIT 1
      `,
      [String(name).trim()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);

    if (!ok) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const organizations = await getAccessibleOrganizations(user.id, user.global_role);
    const organization =
      organizations.find((o) => o.is_active) ||
      organizations[0] ||
      null;

    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    await storeRefreshToken(user.id, refreshToken);

    return res.json(
      buildAuthResponse(user, organization, organizations, accessToken, refreshToken)
    );
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function me(req, res) {
  try {
    const user = await getUserById(req.auth.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const organizations = await getAccessibleOrganizations(user.id, user.global_role);
    const organization =
      organizations.find((o) => o.is_active) ||
      organizations[0] ||
      null;

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        globalRole: user.global_role,
        isActive: user.is_active,
        mustChangePassword: user.must_change_password,
      },
      organization,
      organizations,
    });
  } catch (error) {
    console.error('me error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function selectOrganization(req, res) {
  try {
    const { organizationId } = req.body ?? {};
    const user = await getUserById(req.auth.userId);

    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId requis' });
    }

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const organizations = await getAccessibleOrganizations(user.id, user.global_role);

    const selected = organizations.find(
      (o) => String(o.id) === String(organizationId)
    );

    if (!selected) {
      return res.status(403).json({
        message: 'Accès refusé à cette organisation',
      });
    }

    if (!selected.is_active) {
      return res.status(403).json({
        message: 'Organisation désactivée',
      });
    }

    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    await storeRefreshToken(user.id, refreshToken);

    return res.json(
      buildAuthResponse(user, selected, organizations, accessToken, refreshToken)
    );
  } catch (error) {
    console.error('selectOrganization error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token requis' });
    }

    let payload;
    try {
      payload = jwt.verify(String(refreshToken), REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Refresh token invalide' });
    }

    const tokenHash = sha256(String(refreshToken));

    const tokenResult = await pool.query(
      `
      SELECT id, user_id, revoked_at, expires_at
      FROM refresh_tokens
      WHERE token_hash = $1
      LIMIT 1
      `,
      [tokenHash]
    );

    const tokenRow = tokenResult.rows[0];

    if (!tokenRow || tokenRow.revoked_at) {
      return res.status(401).json({ message: 'Refresh token révoqué' });
    }

    if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      return res.status(401).json({ message: 'Refresh token expiré' });
    }

    if (Number(tokenRow.user_id) !== Number(payload.sub)) {
      return res.status(401).json({ message: 'Refresh token invalide' });
    }

    const user = await getUserById(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur invalide' });
    }

    const organizations = await getAccessibleOrganizations(user.id, user.global_role);
    const organization =
      organizations.find((o) => o.is_active) ||
      organizations[0] ||
      null;

    const accessToken = signAccessToken({ sub: user.id });

    return res.json(
      buildAuthResponse(user, organization, organizations, accessToken)
    );
  } catch (error) {
    console.error('refresh error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return res.status(204).send();
    }

    const tokenHash = sha256(String(refreshToken));

    await pool.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1
      `,
      [tokenHash]
    );

    return res.status(204).send();
  } catch (error) {
    console.error('logout error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Mot de passe actuel et nouveau requis',
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
    }

    const user = await getUserById(req.auth.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const ok = await bcrypt.compare(String(currentPassword), user.password_hash);

    if (!ok) {
      return res.status(400).json({
        message: 'Mot de passe actuel incorrect',
      });
    }

    const newHash = await bcrypt.hash(String(newPassword), 12);

    await pool.query(
      `
      UPDATE users
      SET password_hash = $2,
          must_change_password = FALSE
      WHERE id = $1
      `,
      [req.auth.userId, newHash]
    );

    return res.status(204).send();
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}