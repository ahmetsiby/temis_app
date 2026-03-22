import { pool } from '../db.js';

function normalize(body) {
  return {
    nom: String(body?.nom ?? '').trim(),
    description: body?.description ? String(body.description).trim() : null,
    notes: body?.notes ? String(body.notes).trim() : null,
    depart_centre:
      typeof body?.depart_centre === 'boolean' ? body.depart_centre : true,
    fin_centre:
      typeof body?.fin_centre === 'boolean' ? body.fin_centre : true,
  };
}

function ensureOrganization(req, res) {
  if (!req.organization?.id) {
    res.status(400).json({ message: 'Contexte organisation manquant' });
    return null;
  }
  return req.organization.id;
}

async function findTournee(tourneeId, organizationId) {
  return pool.query(
    `SELECT id, organization_id
     FROM tournees
     WHERE id = $1
       AND organization_id = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [tourneeId, organizationId]
  );
}

async function findClient(clientId, organizationId) {
  return pool.query(
    `SELECT id, organization_id
     FROM clients
     WHERE id = $1
       AND organization_id = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [clientId, organizationId]
  );
}

export async function getAllTournees(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const result = await pool.query(
      `SELECT
        t.id,
        t.nom,
        t.description,
        t.notes,
        t.depart_centre,
        t.fin_centre,
        COALESCE(
          json_agg(
            json_build_object(
              'tourneeId', t.id,
              'client', json_build_object(
                'id', c.id,
                'nom', c.nom,
                'groupe', c.groupe,
                'ville', c.ville,
                'adresse', c.adresse,
                'pays', c.pays,
                'lat', c.lat,
                'lng', c.lng,
                'phone', c.phones_json,
                'horaires', c.horaires_json,
                'protocole', c.protocole,
                'photos', c.photos_json,
                'actif', c.actif
              ),
              'actif', tc.actif,
              'ordre', tc.ordre
            )
            ORDER BY tc.ordre
          ) FILTER (WHERE tc.client_id IS NOT NULL),
          '[]'::json
        ) AS clients
       FROM tournees t
       LEFT JOIN tournee_clients tc
         ON tc.tournee_id = t.id
        AND tc.deleted_at IS NULL
       LEFT JOIN clients c
         ON c.id = tc.client_id
        AND c.deleted_at IS NULL
        AND c.organization_id = t.organization_id
       WHERE t.organization_id = $1
         AND t.deleted_at IS NULL
       GROUP BY t.id
       ORDER BY t.nom ASC`,
      [organizationId]
    );

    return res.json(
      result.rows.map((row) => ({
        tournee: {
          id: row.id,
          nom: row.nom,
          description: row.description,
          notes: row.notes,
          depart_centre: row.depart_centre,
          fin_centre: row.fin_centre,
        },
        clients: row.clients ?? [],
      }))
    );
  } catch (error) {
    console.error('getAllTournees error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function createTournee(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const data = normalize(req.body);

    if (!data.nom) {
      return res.status(400).json({ message: 'Nom obligatoire' });
    }

    const result = await pool.query(
      `INSERT INTO tournees (
        organization_id,
        nom,
        description,
        notes,
        depart_centre,
        fin_centre,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING *`,
      [
        organizationId,
        data.nom,
        data.description,
        data.notes,
        data.depart_centre,
        data.fin_centre,
        req.auth.userId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createTournee error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function updateTournee(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await pool.query(
      `SELECT *
       FROM tournees
       WHERE id = $1
         AND organization_id = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [id, organizationId]
    );

    if (!existing.rowCount) {
      return res.status(404).json({ message: 'Tournée introuvable' });
    }

    const cur = existing.rows[0];

    const hasNom = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'nom');
    const hasDescription = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'description');
    const hasNotes = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'notes');
    const hasDepartCentre = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'depart_centre');
    const hasFinCentre = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'fin_centre');

    const data = {
      nom: hasNom ? String(req.body.nom ?? '').trim() : cur.nom,
      description: hasDescription
        ? (req.body.description ? String(req.body.description).trim() : null)
        : cur.description,
      notes: hasNotes
        ? (req.body.notes ? String(req.body.notes).trim() : null)
        : cur.notes,
      depart_centre: hasDepartCentre ? !!req.body.depart_centre : cur.depart_centre,
      fin_centre: hasFinCentre ? !!req.body.fin_centre : cur.fin_centre,
    };

    if (!data.nom) {
      return res.status(400).json({ message: 'Nom obligatoire' });
    }

    const result = await pool.query(
      `UPDATE tournees
       SET nom = $2,
           description = $3,
           notes = $4,
           depart_centre = $5,
           fin_centre = $6,
           updated_by = $7
       WHERE id = $1
         AND organization_id = $8
         AND deleted_at IS NULL
       RETURNING *`,
      [
        id,
        data.nom,
        data.description,
        data.notes,
        data.depart_centre,
        data.fin_centre,
        req.auth.userId,
        organizationId,
      ]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('updateTournee error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function deleteTournee(req, res) {
  const organizationId = ensureOrganization(req, res);
  if (!organizationId) return;

  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      `UPDATE tournees
       SET deleted_at = NOW(),
           updated_by = $2
       WHERE id = $1
         AND organization_id = $3
         AND deleted_at IS NULL
       RETURNING id`,
      [id, req.auth.userId, organizationId]
    );

    if (!deleted.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Tournée introuvable' });
    }

    await client.query(
      `UPDATE tournee_clients
       SET deleted_at = NOW(),
           updated_at = NOW()
       WHERE tournee_id = $1
         AND deleted_at IS NULL`,
      [id]
    );

    await client.query('COMMIT');
    return res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('deleteTournee error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  } finally {
    client.release();
  }
}

export async function addClientToTournee(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id: tourneeId } = req.params;
    const { clientId } = req.body ?? {};

    if (!clientId) {
      return res.status(400).json({ message: 'clientId requis' });
    }

    const t = await findTournee(tourneeId, organizationId);
    if (!t.rowCount) {
      return res.status(404).json({ message: 'Tournée introuvable' });
    }

    const c = await findClient(clientId, organizationId);
    if (!c.rowCount) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const result = await pool.query(
      `WITH next_ordre AS (
         SELECT COALESCE(MAX(ordre), -1) + 1 AS value
         FROM tournee_clients
         WHERE tournee_id = $1
           AND deleted_at IS NULL
       )
       INSERT INTO tournee_clients (tournee_id, client_id, actif, ordre)
       SELECT $1, $2, TRUE, value
       FROM next_ordre
       ON CONFLICT (tournee_id, client_id)
       DO UPDATE SET
         actif = EXCLUDED.actif,
         ordre = EXCLUDED.ordre,
         deleted_at = NULL,
         updated_at = NOW()
       RETURNING *`,
      [tourneeId, clientId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('addClientToTournee error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function removeClientFromTournee(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id: tourneeId, clientId } = req.params;

    const t = await findTournee(tourneeId, organizationId);
    if (!t.rowCount) {
      return res.status(404).json({ message: 'Tournée introuvable' });
    }

    const c = await findClient(clientId, organizationId);
    if (!c.rowCount) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const result = await pool.query(
      `UPDATE tournee_clients
       SET deleted_at = NOW(),
           updated_at = NOW()
       WHERE tournee_id = $1
         AND client_id = $2
         AND deleted_at IS NULL
       RETURNING tournee_id, client_id`,
      [tourneeId, clientId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Lien introuvable' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('removeClientFromTournee error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function setActifTourneeClient(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id: tourneeId, clientId } = req.params;
    const { actif } = req.body ?? {};

    if (typeof actif !== 'boolean') {
      return res.status(400).json({ message: 'actif doit être un booléen' });
    }

    const t = await findTournee(tourneeId, organizationId);
    if (!t.rowCount) {
      return res.status(404).json({ message: 'Tournée introuvable' });
    }

    const c = await findClient(clientId, organizationId);
    if (!c.rowCount) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const result = await pool.query(
      `UPDATE tournee_clients
       SET actif = $3,
           updated_at = NOW()
       WHERE tournee_id = $1
         AND client_id = $2
         AND deleted_at IS NULL
       RETURNING *`,
      [tourneeId, clientId, actif]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Lien introuvable' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('setActifTourneeClient error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}

export async function reorderTourneeClients(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const { id: tourneeId } = req.params;
    const { orderedClientIds } = req.body ?? {};

    if (!Array.isArray(orderedClientIds) || orderedClientIds.length === 0) {
      return res.status(400).json({ message: 'orderedClientIds requis' });
    }

    const t = await findTournee(tourneeId, organizationId);
    if (!t.rowCount) {
      return res.status(404).json({ message: 'Tournée introuvable' });
    }

    const distinctIds = [...new Set(orderedClientIds.map((v) => String(v)))];

    if (distinctIds.length !== orderedClientIds.length) {
      return res.status(400).json({ message: 'orderedClientIds contient des doublons' });
    }

    const linked = await pool.query(
      `SELECT tc.client_id::text AS client_id
       FROM tournee_clients tc
       JOIN clients c
         ON c.id = tc.client_id
        AND c.organization_id = $2
        AND c.deleted_at IS NULL
       WHERE tc.tournee_id = $1
         AND tc.deleted_at IS NULL`,
      [tourneeId, organizationId]
    );

    const linkedIds = linked.rows.map((r) => String(r.client_id)).sort();
    const askedIds = [...distinctIds].sort();

    if (
      linkedIds.length !== askedIds.length ||
      linkedIds.some((id, index) => id !== askedIds[index])
    ) {
      return res.status(400).json({
        message: 'orderedClientIds doit contenir exactement les clients de la tournée',
      });
    }

    const valuesSql = distinctIds
      .map((_, index) => `($${index * 2 + 1}::uuid, $${index * 2 + 2}::integer)`)
      .join(', ');

    const params = distinctIds.flatMap((clientId, index) => [String(clientId), index]);
    params.push(tourneeId);

    const sql = `
      UPDATE tournee_clients
      SET ordre = v.ordre,
          updated_at = NOW()
      FROM (VALUES ${valuesSql}) AS v(client_id, ordre)
      WHERE tournee_clients.tournee_id = $${params.length}
        AND tournee_clients.client_id = v.client_id
        AND tournee_clients.deleted_at IS NULL
      RETURNING tournee_clients.client_id, tournee_clients.ordre
    `;

    const result = await pool.query(sql, params);

    return res.json({
      updated: result.rowCount,
      items: result.rows,
    });
  } catch (error) {
    console.error('reorderTourneeClients error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}