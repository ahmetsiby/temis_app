import { pool } from '../db.js';

const MAX_SYNC_ITEMS_PER_COLLECTION = 5000;

function ensureOrganization(req, res) {
  if (!req.organization?.id) {
    res.status(400).json({ message: 'Contexte organisation manquant' });
    return null;
  }
  return req.organization.id;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function assertSyncBatchSize(res, name, items) {
  if (items.length > MAX_SYNC_ITEMS_PER_COLLECTION) {
    res.status(413).json({
      message: `Trop d'éléments dans ${name}. Maximum ${MAX_SYNC_ITEMS_PER_COLLECTION}.`,
    });
    return false;
  }
  return true;
}

function safeJsonArray(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function safeNullableString(value) {
  if (value == null || value === '') return null;
  return String(value).trim();
}

function safeNullableNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

async function tourneeExists(db, tourneeId, organizationId) {
  const result = await db.query(
    `SELECT id
     FROM tournees
     WHERE id = $1
       AND organization_id = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [tourneeId, organizationId]
  );
  return result.rowCount > 0;
}

async function clientExists(db, clientId, organizationId) {
  const result = await db.query(
    `SELECT id
     FROM clients
     WHERE id = $1
       AND organization_id = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [clientId, organizationId]
  );
  return result.rowCount > 0;
}

async function getActorName(userId, db) {
  if (!userId) return null;

  const result = await db.query(
    `SELECT name
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.name ?? null;
}

async function addClientAuditLog({
  organizationId,
  clientId,
  clientNom,
  action,
  field = null,
  oldValue = null,
  newValue = null,
  userId = null,
  userName = null,
}, db) {
  await db.query(
    `INSERT INTO client_audit_logs (
      organization_id,
      client_id,
      client_nom,
      action,
      field,
      old_value,
      new_value,
      user_id,
      user_name,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, NOW())`,
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

export async function pushSync(req, res) {
  const userId = req.auth.userId;
  const organizationId = ensureOrganization(req, res);
  if (!organizationId) return;

  const clients = ensureArray(req.body?.clients);
  const tournees = ensureArray(req.body?.tournees);
  const tourneeClients = ensureArray(req.body?.tournee_clients);
  const settings = ensureArray(req.body?.settings);

  if (!assertSyncBatchSize(res, 'clients', clients)) return;
  if (!assertSyncBatchSize(res, 'tournees', tournees)) return;
  if (!assertSyncBatchSize(res, 'tournee_clients', tourneeClients)) return;
  if (!assertSyncBatchSize(res, 'settings', settings)) return;

  const db = await pool.connect();
  const clientResults = [];
  const tourneeResults = [];
  const linkResults = [];
  const settingResults = [];

  try {
    await db.query('BEGIN');

    const actorName = await getActorName(userId, db);

    for (const item of clients) {
      if (!item || typeof item !== 'object') continue;

      if (!item.server_id) {
        if (item.deleted) {
          clientResults.push({
            local_id: item.local_id ?? null,
            server_id: null,
            status: 'deleted-local-only',
            server_updated_at: new Date().toISOString(),
          });
          continue;
        }

        const nom = String(item.nom ?? '').trim();
        if (!nom) {
          clientResults.push({
            local_id: item.local_id ?? null,
            server_id: null,
            status: 'invalid',
            error: 'nom obligatoire',
            server_updated_at: new Date().toISOString(),
          });
          continue;
        }

        const created = await db.query(
          `INSERT INTO clients (
            organization_id, nom, groupe, ville, adresse, pays, lat, lng,
            phones_json, horaires_json, protocole, photos_json,
            actif, created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9::jsonb, $10::jsonb, $11, $12::jsonb,
            $13, $14, $14
          )
          RETURNING *`,
          [
            organizationId,
            nom,
            safeNullableString(item.groupe),
            safeNullableString(item.ville),
            safeNullableString(item.adresse),
            safeNullableString(item.pays),
            safeNullableNumber(item.lat),
            safeNullableNumber(item.lng),
            safeJsonArray(item.phone ?? item.phones),
            safeJsonArray(item.horaires),
            safeNullableString(item.protocole),
            safeJsonArray(item.photos),
            typeof item.actif === 'boolean' ? item.actif : true,
            userId,
          ]
        );

        const createdRow = created.rows[0];

        await addClientAuditLog(
          {
            organizationId,
            clientId: createdRow.id,
            clientNom: createdRow.nom,
            action: 'create',
            newValue: createdRow,
            userId,
            userName: actorName,
          },
          db
        );

        clientResults.push({
          local_id: item.local_id ?? null,
          server_id: createdRow.id,
          status: 'created',
          server_updated_at: createdRow.updated_at,
        });
        continue;
      }

      if (item.deleted) {
        const existing = await db.query(
          `SELECT *
           FROM clients
           WHERE id = $1
             AND organization_id = $2
             AND deleted_at IS NULL
           LIMIT 1`,
          [item.server_id, organizationId]
        );

        const deleted = await db.query(
          `UPDATE clients
           SET deleted_at = NOW(),
               updated_by = $2
           WHERE id = $1
             AND organization_id = $3
             AND deleted_at IS NULL
           RETURNING id, updated_at`,
          [item.server_id, userId, organizationId]
        );

        if (deleted.rowCount) {
          const oldRow = existing.rows[0] ?? null;

          await addClientAuditLog(
            {
              organizationId,
              clientId: item.server_id,
              clientNom: oldRow?.nom ?? '',
              action: 'delete',
              oldValue: oldRow,
              userId,
              userName: actorName,
            },
            db
          );
        }

        clientResults.push({
          local_id: item.local_id ?? null,
          server_id: item.server_id,
          status: deleted.rowCount ? 'deleted' : 'missing',
          server_updated_at: deleted.rows[0]?.updated_at ?? new Date().toISOString(),
        });
        continue;
      }

      const nom = String(item.nom ?? '').trim();
      if (!nom) {
        clientResults.push({
          local_id: item.local_id ?? null,
          server_id: item.server_id,
          status: 'invalid',
          error: 'nom obligatoire',
          server_updated_at: new Date().toISOString(),
        });
        continue;
      }

      const before = await db.query(
        `SELECT *
         FROM clients
         WHERE id = $1
           AND organization_id = $2
           AND deleted_at IS NULL
         LIMIT 1`,
        [item.server_id, organizationId]
      );

      const oldClient = before.rows[0] ?? null;

      const nextPayload = {
        nom,
        groupe: safeNullableString(item.groupe),
        ville: safeNullableString(item.ville),
        adresse: safeNullableString(item.adresse),
        pays: safeNullableString(item.pays),
        lat: safeNullableNumber(item.lat),
        lng: safeNullableNumber(item.lng),
        phones_json: Array.isArray(item.phone ?? item.phones) ? (item.phone ?? item.phones) : [],
        horaires_json: Array.isArray(item.horaires) ? item.horaires : [],
        protocole: safeNullableString(item.protocole),
        photos_json: Array.isArray(item.photos) ? item.photos : [],
        actif: typeof item.actif === 'boolean' ? item.actif : true,
      };

      const updated = await db.query(
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
          item.server_id,
          nextPayload.nom,
          nextPayload.groupe,
          nextPayload.ville,
          nextPayload.adresse,
          nextPayload.pays,
          nextPayload.lat,
          nextPayload.lng,
          JSON.stringify(nextPayload.phones_json),
          JSON.stringify(nextPayload.horaires_json),
          nextPayload.protocole,
          JSON.stringify(nextPayload.photos_json),
          nextPayload.actif,
          userId,
          organizationId,
        ]
      );

      if (updated.rowCount && oldClient) {
        const updatedRow = updated.rows[0];

        const changes = [
          ['nom', oldClient.nom, updatedRow.nom],
          ['groupe', oldClient.groupe, updatedRow.groupe],
          ['ville', oldClient.ville, updatedRow.ville],
          ['adresse', oldClient.adresse, updatedRow.adresse],
          ['pays', oldClient.pays, updatedRow.pays],
          ['lat', oldClient.lat, updatedRow.lat],
          ['lng', oldClient.lng, updatedRow.lng],
          ['phones_json', oldClient.phones_json, updatedRow.phones_json],
          ['horaires_json', oldClient.horaires_json, updatedRow.horaires_json],
          ['protocole', oldClient.protocole, updatedRow.protocole],
          ['photos_json', oldClient.photos_json, updatedRow.photos_json],
          ['actif', oldClient.actif, updatedRow.actif],
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
            await addClientAuditLog(
              {
                organizationId,
                clientId: updatedRow.id,
                clientNom: updatedRow.nom,
                action: 'update',
                field,
                oldValue: oldVal,
                newValue: newVal,
                userId,
                userName: actorName,
              },
              db
            );
          }
        }
      }

      clientResults.push({
        local_id: item.local_id ?? null,
        server_id: item.server_id,
        status: updated.rowCount ? 'updated' : 'missing',
        server_updated_at: updated.rows[0]?.updated_at ?? new Date().toISOString(),
      });
    }

    for (const item of tournees) {
      if (!item || typeof item !== 'object') continue;

      if (!item.server_id) {
        if (item.deleted) {
          tourneeResults.push({
            local_id: item.local_id ?? null,
            server_id: null,
            status: 'deleted-local-only',
            server_updated_at: new Date().toISOString(),
          });
          continue;
        }

        const nom = String(item.nom ?? '').trim();
        if (!nom) {
          tourneeResults.push({
            local_id: item.local_id ?? null,
            server_id: null,
            status: 'invalid',
            error: 'nom obligatoire',
            server_updated_at: new Date().toISOString(),
          });
          continue;
        }

        const created = await db.query(
          `INSERT INTO tournees (
            organization_id, nom, description, notes,
            depart_centre, fin_centre, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
          RETURNING id, updated_at`,
          [
            organizationId,
            nom,
            safeNullableString(item.description),
            safeNullableString(item.notes),
            typeof item.depart_centre === 'boolean' ? item.depart_centre : true,
            typeof item.fin_centre === 'boolean' ? item.fin_centre : true,
            userId,
          ]
        );

        tourneeResults.push({
          local_id: item.local_id ?? null,
          server_id: created.rows[0].id,
          status: 'created',
          server_updated_at: created.rows[0].updated_at,
        });
        continue;
      }

      if (item.deleted) {
        const deleted = await db.query(
          `UPDATE tournees
           SET deleted_at = NOW(),
               updated_by = $2
           WHERE id = $1
             AND organization_id = $3
             AND deleted_at IS NULL
           RETURNING id, updated_at`,
          [item.server_id, userId, organizationId]
        );

        if (deleted.rowCount) {
          await db.query(
            `UPDATE tournee_clients
             SET deleted_at = NOW(),
                 updated_at = NOW()
             WHERE tournee_id = $1
               AND deleted_at IS NULL`,
            [item.server_id]
          );
        }

        tourneeResults.push({
          local_id: item.local_id ?? null,
          server_id: item.server_id,
          status: deleted.rowCount ? 'deleted' : 'missing',
          server_updated_at: deleted.rows[0]?.updated_at ?? new Date().toISOString(),
        });
        continue;
      }

      const nom = String(item.nom ?? '').trim();
      if (!nom) {
        tourneeResults.push({
          local_id: item.local_id ?? null,
          server_id: item.server_id,
          status: 'invalid',
          error: 'nom obligatoire',
          server_updated_at: new Date().toISOString(),
        });
        continue;
      }

      const updated = await db.query(
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
         RETURNING id, updated_at`,
        [
          item.server_id,
          nom,
          safeNullableString(item.description),
          safeNullableString(item.notes),
          typeof item.depart_centre === 'boolean' ? item.depart_centre : true,
          typeof item.fin_centre === 'boolean' ? item.fin_centre : true,
          userId,
          organizationId,
        ]
      );

      tourneeResults.push({
        local_id: item.local_id ?? null,
        server_id: item.server_id,
        status: updated.rowCount ? 'updated' : 'missing',
        server_updated_at: updated.rows[0]?.updated_at ?? new Date().toISOString(),
      });
    }

    for (const item of tourneeClients) {
      if (!item || typeof item !== 'object') continue;
      if (!item.tournee_server_id || !item.client_server_id) continue;

      const hasTournee = await tourneeExists(db, item.tournee_server_id, organizationId);
      const hasClient = await clientExists(db, item.client_server_id, organizationId);

      if (!hasTournee || !hasClient) {
        linkResults.push({
          tournee_server_id: item.tournee_server_id,
          client_server_id: item.client_server_id,
          status: 'missing',
        });
        continue;
      }

      if (item.deleted) {
        const deleted = await db.query(
          `UPDATE tournee_clients tc
           SET deleted_at = NOW(),
               updated_at = NOW()
           WHERE tc.tournee_id = $1
             AND tc.client_id = $2
             AND tc.deleted_at IS NULL
           RETURNING tc.tournee_id, tc.client_id`,
          [item.tournee_server_id, item.client_server_id]
        );

        linkResults.push({
          tournee_server_id: item.tournee_server_id,
          client_server_id: item.client_server_id,
          status: deleted.rowCount ? 'deleted' : 'missing',
        });
        continue;
      }

      const result = await db.query(
        `INSERT INTO tournee_clients (tournee_id, client_id, actif, ordre)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tournee_id, client_id)
         DO UPDATE SET
           actif = EXCLUDED.actif,
           ordre = EXCLUDED.ordre,
           deleted_at = NULL,
           updated_at = NOW()
         RETURNING tournee_id, client_id, updated_at`,
        [
          item.tournee_server_id,
          item.client_server_id,
          typeof item.actif === 'boolean' ? item.actif : true,
          Number.isFinite(Number(item.ordre)) ? Number(item.ordre) : 0,
        ]
      );

      linkResults.push({
        tournee_server_id: result.rows[0].tournee_id,
        client_server_id: result.rows[0].client_id,
        status: 'upserted',
        server_updated_at: result.rows[0].updated_at,
      });
    }

    for (const item of settings) {
      if (!item || typeof item !== 'object') continue;

      const key = String(item.key ?? '').trim();
      if (!key) continue;

      if (item.deleted) {
        const deleted = await db.query(
          `UPDATE settings
           SET deleted_at = NOW(),
               updated_at = NOW()
           WHERE organization_id = $1
             AND key = $2
             AND deleted_at IS NULL
           RETURNING key, updated_at`,
          [organizationId, key]
        );

        settingResults.push({
          key,
          status: deleted.rowCount ? 'deleted' : 'missing',
          server_updated_at: deleted.rows[0]?.updated_at ?? new Date().toISOString(),
        });
        continue;
      }

      const result = await db.query(
        `INSERT INTO settings (organization_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (organization_id, key)
         DO UPDATE SET
           value = EXCLUDED.value,
           deleted_at = NULL,
           updated_at = NOW()
         RETURNING key, updated_at`,
        [organizationId, key, item.value == null ? null : String(item.value)]
      );

      settingResults.push({
        key,
        status: 'upserted',
        server_updated_at: result.rows[0].updated_at,
      });
    }

    await db.query('COMMIT');

    return res.json({
      serverTime: new Date().toISOString(),
      clients_results: clientResults,
      tournees_results: tourneeResults,
      tournee_clients_results: linkResults,
      settings_results: settingResults,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('pushSync error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  } finally {
    db.release();
  }
}

export async function pullSync(req, res) {
  try {
    const organizationId = ensureOrganization(req, res);
    if (!organizationId) return;

    const since = String(req.query.since ?? '').trim();

    const clientsUpserts = await pool.query(
      `SELECT *
       FROM clients
       WHERE organization_id = $1
         AND deleted_at IS NULL
         AND ($2 = '' OR updated_at > $2::timestamptz)
       ORDER BY updated_at ASC`,
      [organizationId, since]
    );

    const clientsDeletes = await pool.query(
      `SELECT id, deleted_at
       FROM clients
       WHERE organization_id = $1
         AND deleted_at IS NOT NULL
         AND ($2 = '' OR deleted_at > $2::timestamptz)
       ORDER BY deleted_at ASC`,
      [organizationId, since]
    );

    const tourneesUpserts = await pool.query(
      `SELECT *
       FROM tournees
       WHERE organization_id = $1
         AND deleted_at IS NULL
         AND ($2 = '' OR updated_at > $2::timestamptz)
       ORDER BY updated_at ASC`,
      [organizationId, since]
    );

    const tourneesDeletes = await pool.query(
      `SELECT id, deleted_at
       FROM tournees
       WHERE organization_id = $1
         AND deleted_at IS NOT NULL
         AND ($2 = '' OR deleted_at > $2::timestamptz)
       ORDER BY deleted_at ASC`,
      [organizationId, since]
    );

    const linksUpserts = await pool.query(
      `SELECT tc.tournee_id, tc.client_id, tc.actif, tc.ordre, tc.updated_at
       FROM tournee_clients tc
       JOIN tournees t ON t.id = tc.tournee_id
       JOIN clients c ON c.id = tc.client_id
       WHERE t.organization_id = $1
         AND c.organization_id = $1
         AND tc.deleted_at IS NULL
         AND t.deleted_at IS NULL
         AND c.deleted_at IS NULL
         AND ($2 = '' OR tc.updated_at > $2::timestamptz)
       ORDER BY tc.updated_at ASC`,
      [organizationId, since]
    );

    const linksDeletes = await pool.query(
      `SELECT tc.tournee_id, tc.client_id, tc.deleted_at
       FROM tournee_clients tc
       JOIN tournees t ON t.id = tc.tournee_id
       JOIN clients c ON c.id = tc.client_id
       WHERE t.organization_id = $1
         AND c.organization_id = $1
         AND tc.deleted_at IS NOT NULL
         AND ($2 = '' OR tc.deleted_at > $2::timestamptz)
       ORDER BY tc.deleted_at ASC`,
      [organizationId, since]
    );

    const settingsUpserts = await pool.query(
      `SELECT key, value, updated_at
       FROM settings
       WHERE organization_id = $1
         AND deleted_at IS NULL
         AND ($2 = '' OR updated_at > $2::timestamptz)
       ORDER BY updated_at ASC`,
      [organizationId, since]
    );

    const settingsDeletes = await pool.query(
      `SELECT key, deleted_at
       FROM settings
       WHERE organization_id = $1
         AND deleted_at IS NOT NULL
         AND ($2 = '' OR deleted_at > $2::timestamptz)
       ORDER BY deleted_at ASC`,
      [organizationId, since]
    );

    return res.json({
      serverTime: new Date().toISOString(),
      clients: {
        upserts: clientsUpserts.rows,
        deletes: clientsDeletes.rows,
      },
      tournees: {
        upserts: tourneesUpserts.rows,
        deletes: tourneesDeletes.rows,
      },
      tournee_clients: {
        upserts: linksUpserts.rows,
        deletes: linksDeletes.rows,
      },
      settings: {
        upserts: settingsUpserts.rows,
        deletes: settingsDeletes.rows,
      },
    });
  } catch (error) {
    console.error('pullSync error:', error);
    return res.status(500).json({ message: 'Erreur interne serveur' });
  }
}