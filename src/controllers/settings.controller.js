import { pool } from '../db.js';

function ensureOrganization(req, res) {
  if (!req.organization?.id) {
    res.status(400).json({
      message: 'Contexte organisation manquant',
    });
    return null;
  }
  return req.organization.id;
}

export async function getSettings(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const result = await pool.query(
      `SELECT key, value, updated_at
       FROM settings
       WHERE organization_id = $1
         AND deleted_at IS NULL
       ORDER BY key ASC`,
      [organizationId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export async function upsertSetting(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { key, value } = req.body ?? {};

    const normalizedKey = String(key ?? '').trim();

    if (!normalizedKey) {
      return res.status(400).json({
        message: 'key requise',
      });
    }

    const result = await pool.query(
      `INSERT INTO settings (organization_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, key)
       DO UPDATE SET
         value = EXCLUDED.value,
         deleted_at = NULL,
         updated_at = NOW()
       RETURNING key, value, updated_at`,
      [organizationId, normalizedKey, value == null ? null : String(value)]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('upsertSetting error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export async function deleteSetting(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const key = String(req.params.key ?? '').trim();

    if (!key) {
      return res.status(400).json({
        message: 'key requise',
      });
    }

    const result = await pool.query(
      `UPDATE settings
       SET deleted_at = NOW(),
           updated_at = NOW()
       WHERE organization_id = $1
         AND key = $2
         AND deleted_at IS NULL
       RETURNING key`,
      [organizationId, key]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: 'Setting introuvable',
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('deleteSetting error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}