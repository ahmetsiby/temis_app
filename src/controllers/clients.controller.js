import { pool } from '../db.js';

function normalize(body) {
  return {
    nom: String(body?.nom ?? '').trim(),
    groupe: body?.groupe ? String(body.groupe).trim() : null,
    ville: body?.ville ? String(body.ville).trim() : null,
    adresse: body?.adresse ? String(body.adresse).trim() : null,
    pays: body?.pays ? String(body.pays).trim() : null,
    lat: body?.lat == null || body?.lat === '' ? null : Number(body.lat),
    lng: body?.lng == null || body?.lng === '' ? null : Number(body.lng),
    phones_json: JSON.stringify(
      Array.isArray(body?.phone)
        ? body.phone
        : Array.isArray(body?.phones)
        ? body.phones
        : body?.phones_json ?? []
    ),
    horaires_json: JSON.stringify(
      Array.isArray(body?.horaires)
        ? body.horaires
        : body?.horaires_json ?? []
    ),
    protocole: body?.protocole ? String(body.protocole).trim() : null,
    photos_json: JSON.stringify(
      Array.isArray(body?.photos)
        ? body.photos
        : body?.photos_json ?? []
    ),
    actif: typeof body?.actif === 'boolean' ? body.actif : true,
  };
}

function ensureOrganization(req, res) {
  const organizationId =
    req.organization?.id ??
    req.auth?.organizationId ??
    req.auth?.organization_id ??
    null;

  if (!organizationId) {
    res.status(400).json({
      message: 'Contexte organisation manquant',
    });
    return null;
  }

  return organizationId;
}

async function getActorName(userId, client = pool) {
  if (!userId) return null;

  const result = await client.query(
    `SELECT name
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.name ?? null;
}

async function addClientAuditLog(
  {
    organizationId,
    clientId,
    clientNom,
    action,
    field = null,
    oldValue = null,
    newValue = null,
    userId = null,
    userName = null,
  },
  client = pool
) {
  await client.query(
    `INSERT INTO client_audit_logs (
      organization_id,
      client_id,
      client_nom,
      action,
      field,
      old_value,
      new_value,
      user_id,
      user_name
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)`,
    [
      organizationId,
      clientId,
      clientNom,
      action,
      field,
      oldValue === null ? null : JSON.stringify(oldValue),
      newValue === null ? null : JSON.stringify(newValue),
      userId,
      userName,
    ]
  );
}

export async function getAllClients(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const result = await pool.query(
      `SELECT *
       FROM clients
       WHERE organization_id = $1
         AND deleted_at IS NULL
       ORDER BY nom ASC`,
      [organizationId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('getAllClients error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export async function createClient(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const data = normalize(req.body);

    if (!data.nom) {
      return res.status(400).json({
        message: 'Nom obligatoire',
      });
    }

    if (data.lat !== null && Number.isNaN(data.lat)) {
      return res.status(400).json({
        message: 'Latitude invalide',
      });
    }

    if (data.lng !== null && Number.isNaN(data.lng)) {
      return res.status(400).json({
        message: 'Longitude invalide',
      });
    }

    const result = await pool.query(
      `INSERT INTO clients (
        organization_id,
        nom,
        groupe,
        ville,
        adresse,
        pays,
        lat,
        lng,
        phones_json,
        horaires_json,
        protocole,
        photos_json,
        actif,
        created_by,
        updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::jsonb, $10::jsonb, $11, $12::jsonb,
        $13, $14, $14
      )
      RETURNING *`,
      [
        organizationId,
        data.nom,
        data.groupe,
        data.ville,
        data.adresse,
        data.pays,
        data.lat,
        data.lng,
        data.phones_json,
        data.horaires_json,
        data.protocole,
        data.photos_json,
        data.actif,
        req.auth.userId,
      ]
    );

    const created = result.rows[0];
    const actorName = await getActorName(req.auth.userId);

    await addClientAuditLog({
      organizationId,
      clientId: created.id,
      clientNom: created.nom,
      action: 'create',
      newValue: created,
      userId: req.auth.userId,
      userName: actorName,
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('createClient error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export async function updateClient(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await pool.query(
      `SELECT *
       FROM clients
       WHERE id = $1
         AND organization_id = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [id, organizationId]
    );

    if (!existing.rowCount) {
      return res.status(404).json({
        message: 'Client introuvable',
      });
    }

    const cur = existing.rows[0];

    const merged = normalize({
      nom: req.body?.nom ?? cur.nom,
      groupe: req.body?.groupe ?? cur.groupe,
      ville: req.body?.ville ?? cur.ville,
      adresse: req.body?.adresse ?? cur.adresse,
      pays: req.body?.pays ?? cur.pays,
      lat: req.body?.lat ?? cur.lat,
      lng: req.body?.lng ?? cur.lng,
      phone: req.body?.phone ?? req.body?.phones ?? cur.phones_json,
      horaires: req.body?.horaires ?? cur.horaires_json,
      protocole: req.body?.protocole ?? cur.protocole,
      photos: req.body?.photos ?? cur.photos_json,
      actif: typeof req.body?.actif === 'boolean' ? req.body.actif : cur.actif,
    });

    if (!merged.nom) {
      return res.status(400).json({
        message: 'Nom obligatoire',
      });
    }

    if (merged.lat !== null && Number.isNaN(merged.lat)) {
      return res.status(400).json({
        message: 'Latitude invalide',
      });
    }

    if (merged.lng !== null && Number.isNaN(merged.lng)) {
      return res.status(400).json({
        message: 'Longitude invalide',
      });
    }

    const result = await pool.query(
      `UPDATE clients
       SET nom = $2,
           groupe = $3,
           ville = $4,
           adresse = $5,
           pays = $6,
           lat = $7,
           lng = $8,
           phones_json = $9::jsonb,
           horaires_json = $10::jsonb,
           protocole = $11,
           photos_json = $12::jsonb,
           actif = $13,
           updated_by = $14
       WHERE id = $1
         AND organization_id = $15
         AND deleted_at IS NULL
       RETURNING *`,
      [
        id,
        merged.nom,
        merged.groupe,
        merged.ville,
        merged.adresse,
        merged.pays,
        merged.lat,
        merged.lng,
        merged.phones_json,
        merged.horaires_json,
        merged.protocole,
        merged.photos_json,
        merged.actif,
        req.auth.userId,
        organizationId,
      ]
    );

    const updated = result.rows[0];
    const actorName = await getActorName(req.auth.userId);

    const changes = [
      ['nom', cur.nom, updated.nom],
      ['groupe', cur.groupe, updated.groupe],
      ['ville', cur.ville, updated.ville],
      ['adresse', cur.adresse, updated.adresse],
      ['pays', cur.pays, updated.pays],
      ['lat', cur.lat, updated.lat],
      ['lng', cur.lng, updated.lng],
      ['protocole', cur.protocole, updated.protocole],
      ['actif', cur.actif, updated.actif],
      ['phones_json', cur.phones_json, updated.phones_json],
      ['horaires_json', cur.horaires_json, updated.horaires_json],
      ['photos_json', cur.photos_json, updated.photos_json],
    ];

    for (const [field, oldVal, newVal] of changes) {
      const oldNorm =
        oldVal && typeof oldVal === 'object'
          ? JSON.stringify(oldVal)
          : String(oldVal ?? '');

      const newNorm =
        newVal && typeof newVal === 'object'
          ? JSON.stringify(newVal)
          : String(newVal ?? '');

      if (oldNorm !== newNorm) {
        await addClientAuditLog({
          organizationId,
          clientId: updated.id,
          clientNom: updated.nom,
          action: 'update',
          field,
          oldValue: oldVal,
          newValue: newVal,
          userId: req.auth.userId,
          userName: actorName,
        });
      }
    }

    return res.json(updated);
  } catch (error) {
    console.error('updateClient error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export async function deleteClient(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await pool.query(
      `SELECT *
       FROM clients
       WHERE id = $1
         AND organization_id = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [id, organizationId]
    );

    if (!existing.rowCount) {
      return res.status(404).json({
        message: 'Client introuvable',
      });
    }

    const cur = existing.rows[0];

    const result = await pool.query(
      `UPDATE clients
       SET deleted_at = NOW(),
           updated_by = $2
       WHERE id = $1
         AND organization_id = $3
         AND deleted_at IS NULL
       RETURNING id`,
      [id, req.auth.userId, organizationId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: 'Client introuvable',
      });
    }

    const actorName = await getActorName(req.auth.userId);

    await addClientAuditLog({
      organizationId,
      clientId: cur.id,
      clientNom: cur.nom,
      action: 'delete',
      oldValue: cur,
      userId: req.auth.userId,
      userName: actorName,
    });

    return res.status(204).send();
  } catch (error) {
    console.error('deleteClient error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}

export async function getClientAuditLogs(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { clientId, action, userId, limit = '200' } = req.query;

    const values = [organizationId];
    const where = [`organization_id = $1`];

    if (clientId) {
      values.push(String(clientId));
      where.push(`client_id = $${values.length}`);
    }

    if (action) {
      values.push(String(action));
      where.push(`action = $${values.length}`);
    }

    if (userId) {
      values.push(String(userId));
      where.push(`user_id = $${values.length}`);
    }

    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
    values.push(safeLimit);

    const result = await pool.query(
      `SELECT *
       FROM client_audit_logs
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length}`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('getClientAuditLogs error:', error);
    return res.status(500).json({
      message: 'Erreur interne serveur',
    });
  }
}