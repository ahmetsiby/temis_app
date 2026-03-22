import { pool } from '../db.js';
function normalizeOrganizationBody(body) {
  const phones = Array.isArray(body?.phones ?? body?.phones_json)
    ? (body.phones ?? body.phones_json)
        .map((v) => String(v ?? '').trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  const lat =
    body?.lat == null || body?.lat === '' ? null : Number(body.lat);

  const lng =
    body?.lng == null || body?.lng === '' ? null : Number(body.lng);

  return {
    code: body?.code == null ? null : String(body.code).trim().toUpperCase(),
    name: body?.name == null ? null : String(body.name).trim(),
    adresse: body?.adresse ? String(body.adresse).trim() : null,
    ville: body?.ville ? String(body.ville).trim() : null,
    pays: body?.pays ? String(body.pays).trim() : null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    phones_json: phones,
    is_active:
      typeof body?.is_active === 'boolean' ? body.is_active : null,
  };
}

export async function listOrganizations(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        id,
        code,
        name,
        is_active,
        adresse,
        ville,
        pays,
        lat,
        lng,
        phones_json,
        created_at,
        updated_at
      FROM organizations
      ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('listOrganizations error:', error);
    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function createOrganization(req, res) {
  try {
    const data = normalizeOrganizationBody(req.body);

    if (!data.code || !data.name) {
      return res.status(400).json({
        message: 'code et name sont requis',
      });
    }

    const result = await pool.query(
      `INSERT INTO organizations (
         code,
         name,
         is_active,
         adresse,
         ville,
         pays,
         lat,
         lng,
         phones_json
       )
       VALUES ($1,$2,TRUE,$3,$4,$5,$6,$7,$8::jsonb)
       RETURNING
         id,
         code,
         name,
         is_active,
         adresse,
         ville,
         pays,
         lat,
         lng,
         phones_json,
         created_at,
         updated_at`,
      [
        data.code,
        data.name,
        data.adresse,
        data.ville,
        data.pays,
        data.lat,
        data.lng,
        JSON.stringify(data.phones_json),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createOrganization error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Organisation déjà existante',
      });
    }

    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function updateOrganization(req, res) {
  try {
    const { organizationId } = req.params;

    const existing = await pool.query(
      `SELECT
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
       WHERE id = $1
       LIMIT 1`,
      [organizationId]
    );

    if (!existing.rowCount) {
      return res.status(404).json({
        message: 'Organisation introuvable',
      });
    }

    const cur = existing.rows[0];
    const body = req.body ?? {};
    const data = normalizeOrganizationBody(body);

    const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

    const result = await pool.query(
      `UPDATE organizations
       SET code = $2,
           name = $3,
           is_active = $4,
           adresse = $5,
           ville = $6,
           pays = $7,
           lat = $8,
           lng = $9,
           phones_json = $10::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING
         id,
         code,
         name,
         is_active,
         adresse,
         ville,
         pays,
         lat,
         lng,
         phones_json,
         created_at,
         updated_at`,
      [
        organizationId,
        has('code') ? data.code : cur.code,
        has('name') ? data.name : cur.name,
        has('is_active') ? data.is_active : cur.is_active,
        has('adresse') ? data.adresse : cur.adresse,
        has('ville') ? data.ville : cur.ville,
        has('pays') ? data.pays : cur.pays,
        has('lat') ? data.lat : cur.lat,
        has('lng') ? data.lng : cur.lng,
        has('phones') || has('phones_json')
          ? JSON.stringify(data.phones_json)
          : JSON.stringify(Array.isArray(cur.phones_json) ? cur.phones_json : []),
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('updateOrganization error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Organisation déjà existante',
      });
    }

    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function deleteOrganization(req, res) {
  try {
    const { organizationId } = req.params;

    const result = await pool.query(
      `DELETE FROM organizations
       WHERE id = $1
       RETURNING id`,
      [organizationId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: 'Organisation introuvable',
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('deleteOrganization error:', error);
    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function getOrganizationMembers(req, res) {
  try {
    const organizationId = req.organization.id;

    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.global_role,
         om.role,
         om.assigned_at
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY u.name ASC`,
      [organizationId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getOrganizationMembers error:', error);
    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function addOrganizationMember(req, res) {
  try {
    const organizationId = req.organization.id;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        message: 'userId et role requis',
      });
    }

    await pool.query(
      `INSERT INTO organization_members
       (organization_id, user_id, role, assigned_at, assigned_by)
       VALUES ($1,$2,$3,NOW(),$4)`,
      [organizationId, userId, role, req.auth.userId]
    );

    res.status(201).json({
      message: 'Membre ajouté',
    });
  } catch (error) {
    console.error('addOrganizationMember error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Utilisateur déjà membre',
      });
    }

    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function updateOrganizationMemberRole(req, res) {
  try {
    const organizationId = req.organization.id;
    const { userId } = req.params;
    const { role } = req.body;

    const result = await pool.query(
      `UPDATE organization_members
       SET role = $3
       WHERE organization_id = $1
       AND user_id = $2
       RETURNING organization_id`,
      [organizationId, userId, role]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: 'Membre introuvable',
      });
    }

    res.json({
      message: 'Rôle mis à jour',
    });
  } catch (error) {
    console.error('updateOrganizationMemberRole error:', error);
    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function removeOrganizationMember(req, res) {
  try {
    const organizationId = req.organization.id;
    const { userId } = req.params;

    const result = await pool.query(
      `DELETE FROM organization_members
       WHERE organization_id = $1
       AND user_id = $2`,
      [organizationId, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: 'Membre introuvable',
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('removeOrganizationMember error:', error);
    res.status(500).json({ message: 'Erreur interne serveur' });
  }
}