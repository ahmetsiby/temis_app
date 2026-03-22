import{a as E}from"./chunk-OTVO6CYV.js";import{a as f}from"./chunk-3LHFJIOB.js";import{b as h}from"./chunk-7CP3PMW4.js";import{d as p,da as g,e as _,f as N,k as m}from"./chunk-EVOF35PR.js";import{b as y}from"./chunk-62EEP25W.js";import{g as a}from"./chunk-2R6CW7ES.js";var w=(()=>{let s=class s{constructor(e){this.sqlite=e,this.auth=N(h),this.mem=new Map}isWeb(){return y.getPlatform()==="web"}dbOrNull(){return a(this,null,function*(){return yield this.sqlite.init()})}getOrganizationId(){return String(this.auth.organization()?.id??"").trim()}scopedMemKey(e,i){return`${e}::${i}`}get(e){return a(this,null,function*(){let i=String(e||"").trim(),r=this.getOrganizationId();if(!i||!r)return"";if(this.isWeb())return this.mem.get(this.scopedMemKey(r,i))??"";let t=yield this.dbOrNull();if(!t)return this.mem.get(this.scopedMemKey(r,i))??"";let n=yield t.query(`SELECT value
       FROM settings
       WHERE organization_id = ?
         AND deleted = 0
         AND key = ?
       LIMIT 1;`,[r,i]);return String(n.values?.[0]?.value??"")})}set(e,i){return a(this,null,function*(){let r=String(e||"").trim(),t=String(i??""),n=this.getOrganizationId(),o=Date.now();if(!r||!n)return;if(this.isWeb()){this.mem.set(this.scopedMemKey(n,r),t);return}let l=yield this.dbOrNull();if(!l){this.mem.set(this.scopedMemKey(n,r),t);return}yield l.run(`INSERT INTO settings(organization_id, key, value, updated_at, dirty, deleted)
       VALUES(?, ?, ?, ?, 1, 0)
       ON CONFLICT(organization_id, key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at,
         dirty = 1,
         deleted = 0;`,[n,r,t,o])})}remove(e){return a(this,null,function*(){let i=String(e||"").trim(),r=this.getOrganizationId(),t=Date.now();if(!i||!r)return;if(this.isWeb()){this.mem.delete(this.scopedMemKey(r,i));return}let n=yield this.dbOrNull();if(!n){this.mem.delete(this.scopedMemKey(r,i));return}yield n.run(`UPDATE settings
       SET deleted = 1,
           dirty = 1,
           updated_at = ?
       WHERE organization_id = ?
         AND key = ?;`,[t,r,i])})}clearOrganizationSettings(){return a(this,null,function*(){let e=this.getOrganizationId();if(!e)return;if(this.isWeb()){for(let r of Array.from(this.mem.keys()))r.startsWith(`${e}::`)&&this.mem.delete(r);return}let i=yield this.dbOrNull();i&&(yield i.run(`DELETE FROM settings
       WHERE organization_id = ?;`,[e]))})}getCentreAddress(){return a(this,null,function*(){return yield this.get("centre_address")})}setCentreAddress(e){return a(this,null,function*(){yield this.set("centre_address",String(e??"").trim())})}getCentreLatLng(){return a(this,null,function*(){let e=yield this.get("centre_lat"),i=yield this.get("centre_lng"),r=Number(e),t=Number(i);return!Number.isFinite(r)||!Number.isFinite(t)?null:{lat:r,lng:t}})}setCentreLatLng(e,i){return a(this,null,function*(){yield this.set("centre_lat",String(e)),yield this.set("centre_lng",String(i))})}};s.\u0275fac=function(i){return new(i||s)(_(E))},s.\u0275prov=p({token:s,factory:s.\u0275fac,providedIn:"root"});let c=s;return c})();var W=(()=>{let s=class s{constructor(e,i,r,t){this.auth=e,this.sqlite=i,this.settingsRepo=r,this.api=t,this._running=m(!1),this._lastError=m(null),this._lastSyncAt=m(null),this.running=g(()=>this._running()),this.lastError=g(()=>this._lastError()),this.lastSyncAt=g(()=>this._lastSyncAt())}isMobileCapacitor(){let e=y.getPlatform();return e==="android"||e==="ios"}syncAll(){return a(this,null,function*(){if(!this._running()&&this.isMobileCapacitor()){this._running.set(!0),this._lastError.set(null);try{let e=this.getOrganizationId();if(!e)throw new Error("Organisation introuvable pour la synchronisation");let i=yield this.sqlite.init();if(!i)throw new Error("SQLite indisponible sur cette plateforme");let r=yield this.settingsRepo.get("last_sync_at"),t={lastSyncAt:r,clients:yield this.readDirtyClients(i,e),tournees:yield this.readDirtyTournees(i,e),tournee_clients:yield this.readDirtyTourneeClients(i,e),settings:yield this.readDirtySettings(i,e),audit_logs:yield this.readAuditLogs(i,e)},n=yield this.apiPost("/sync/push",t);yield this.applyPushResults(i,e,n);let o=yield this.apiGet(`/sync/pull?since=${encodeURIComponent(r||"")}`);yield this.applyPullResults(i,e,o),yield this.settingsRepo.set("last_sync_at",o.serverTime),this._lastSyncAt.set(o.serverTime)}catch(e){throw this._lastError.set(e?.message??"Erreur de synchronisation"),e}finally{this._running.set(!1)}}})}readDirtyClients(e,i){return a(this,null,function*(){return((yield e.query(`SELECT
         id,
         server_id,
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
         updated_at,
         deleted
       FROM clients
       WHERE organization_id = ?
         AND dirty = 1
       ORDER BY updated_at ASC, id ASC;`,[i])).values??[]).map(t=>({local_id:Number(t.id),server_id:t.server_id??null,nom:String(t.nom??""),groupe:t.groupe??null,ville:t.ville??null,adresse:t.adresse??null,pays:t.pays??null,lat:this.toNullableNumber(t.lat),lng:this.toNullableNumber(t.lng),phone:this.parseJsonArray(t.phones_json),horaires:this.parseJsonArray(t.horaires_json),protocole:t.protocole??null,photos:this.parseJsonArray(t.photos_json),actif:Number(t.actif??1)===1,updated_at:Number(t.updated_at??0),deleted:Number(t.deleted??0)===1}))})}readDirtyTournees(e,i){return a(this,null,function*(){return((yield e.query(`SELECT
         id,
         server_id,
         nom,
         description,
         notes,
         depart_centre,
         fin_centre,
         updated_at,
         deleted
       FROM tournees
       WHERE organization_id = ?
         AND dirty = 1
       ORDER BY updated_at ASC, id ASC;`,[i])).values??[]).map(t=>({local_id:Number(t.id),server_id:t.server_id??null,nom:String(t.nom??""),description:t.description??null,notes:t.notes??null,depart_centre:Number(t.depart_centre??1)===1,fin_centre:Number(t.fin_centre??1)===1,updated_at:Number(t.updated_at??0),deleted:Number(t.deleted??0)===1}))})}readDirtyTourneeClients(e,i){return a(this,null,function*(){return((yield e.query(`SELECT
         tc.tournee_id,
         tc.client_id,
         tc.actif,
         tc.ordre,
         tc.updated_at,
         tc.deleted,
         t.server_id AS tournee_server_id,
         c.server_id AS client_server_id
       FROM tournee_clients tc
       JOIN tournees t
         ON t.id = tc.tournee_id
        AND t.organization_id = tc.organization_id
       JOIN clients c
         ON c.id = tc.client_id
        AND c.organization_id = tc.organization_id
       WHERE tc.organization_id = ?
         AND tc.dirty = 1
       ORDER BY tc.updated_at ASC, tc.tournee_id ASC, tc.client_id ASC;`,[i])).values??[]).map(t=>({tournee_local_id:Number(t.tournee_id),client_local_id:Number(t.client_id),tournee_server_id:t.tournee_server_id??null,client_server_id:t.client_server_id??null,actif:Number(t.actif??1)===1,ordre:Number(t.ordre??0),updated_at:Number(t.updated_at??0),deleted:Number(t.deleted??0)===1}))})}readDirtySettings(e,i){return a(this,null,function*(){return((yield e.query(`SELECT key, value, updated_at, deleted
       FROM settings
       WHERE organization_id = ?
         AND dirty = 1
       ORDER BY updated_at ASC, key ASC;`,[i])).values??[]).map(t=>({key:String(t.key),value:t.value??null,updated_at:Number(t.updated_at??0),deleted:Number(t.deleted??0)===1}))})}readAuditLogs(e,i){return a(this,null,function*(){return((yield e.query(`SELECT *
     FROM client_audit_logs
     WHERE organization_id = ?
     ORDER BY created_at ASC;`,[i])).values??[]).map(t=>({id:Number(t.id),client_id:Number(t.client_id),client_nom:String(t.client_nom??""),action:String(t.action??""),field:t.field??null,old_value:t.old_value??null,new_value:t.new_value??null,user_id:t.user_id??null,user_name:t.user_name??null,created_at:Number(t.created_at??0)}))})}applyPushResults(e,i,r){return a(this,null,function*(){for(let t of r.clients_results??[])yield e.run(`UPDATE clients
         SET server_id = ?, dirty = 0, updated_at = ?
         WHERE organization_id = ?
           AND id = ?;`,[t.server_id??null,new Date(t.server_updated_at).getTime(),i,Number(t.local_id)]);for(let t of r.tournees_results??[])yield e.run(`UPDATE tournees
         SET server_id = ?, dirty = 0, updated_at = ?
         WHERE organization_id = ?
           AND id = ?;`,[t.server_id??null,new Date(t.server_updated_at).getTime(),i,Number(t.local_id)]);yield e.run(`UPDATE tournee_clients
       SET dirty = 0
       WHERE organization_id = ?
         AND dirty = 1;`,[i]),yield e.run(`UPDATE settings
       SET dirty = 0
       WHERE organization_id = ?
         AND dirty = 1;`,[i])})}applyPullResults(e,i,r){return a(this,null,function*(){yield this.applyPulledClients(e,i,r.clients?.upserts??[],r.clients?.deletes??[]),yield this.applyPulledTournees(e,i,r.tournees?.upserts??[],r.tournees?.deletes??[]),yield this.applyPulledTourneeClients(e,i,r.tournee_clients?.upserts??[],r.tournee_clients?.deletes??[]),yield this.applyPulledAuditLogs(e,i,r.audit_logs?.upserts??[]),yield this.applyPulledSettings(e,i,r.settings?.upserts??[],r.settings?.deletes??[])})}applyPulledClients(e,i,r,t){return a(this,null,function*(){for(let n of r){let o=yield e.query(`SELECT id
         FROM clients
         WHERE organization_id = ?
           AND server_id = ?
         LIMIT 1;`,[i,n.id]),l=Number(o.values?.[0]?.id??0),d=new Date(n.updated_at).getTime();if(l>0)yield e.run(`UPDATE clients
           SET nom = ?,
               groupe = ?,
               ville = ?,
               adresse = ?,
               pays = ?,
               lat = ?,
               lng = ?,
               phones_json = ?,
               horaires_json = ?,
               protocole = ?,
               photos_json = ?,
               actif = ?,
               updated_at = ?,
               dirty = 0,
               deleted = 0
           WHERE organization_id = ?
             AND server_id = ?;`,[n.nom,n.groupe??null,n.ville??null,n.adresse??null,n.pays??null,this.toNullableNumber(n.lat),this.toNullableNumber(n.lng),JSON.stringify(n.phones_json??[]),JSON.stringify(n.horaires_json??[]),n.protocole??null,JSON.stringify(n.photos_json??[]),n.actif?1:0,d,i,n.id]);else{let u=yield this.nextId(e,"clients");yield e.run(`INSERT INTO clients(
             id,
             server_id,
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
             updated_at,
             dirty,
             deleted
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0);`,[u,n.id,i,n.nom,n.groupe??null,n.ville??null,n.adresse??null,n.pays??null,this.toNullableNumber(n.lat),this.toNullableNumber(n.lng),JSON.stringify(n.phones_json??[]),JSON.stringify(n.horaires_json??[]),n.protocole??null,JSON.stringify(n.photos_json??[]),n.actif?1:0,d])}}for(let n of t)yield e.run(`UPDATE clients
         SET deleted = 1,
             dirty = 0,
             updated_at = ?
         WHERE organization_id = ?
           AND server_id = ?;`,[new Date(n.deleted_at).getTime(),i,n.id])})}applyPulledTournees(e,i,r,t){return a(this,null,function*(){for(let n of r){let o=yield e.query(`SELECT id
         FROM tournees
         WHERE organization_id = ?
           AND server_id = ?
         LIMIT 1;`,[i,n.id]),l=Number(o.values?.[0]?.id??0),d=new Date(n.updated_at).getTime();if(l>0)yield e.run(`UPDATE tournees
           SET nom = ?,
               description = ?,
               notes = ?,
               depart_centre = ?,
               fin_centre = ?,
               updated_at = ?,
               dirty = 0,
               deleted = 0
           WHERE organization_id = ?
             AND server_id = ?;`,[n.nom,n.description??null,n.notes??null,n.depart_centre?1:0,n.fin_centre?1:0,d,i,n.id]);else{let u=yield this.nextId(e,"tournees");yield e.run(`INSERT INTO tournees(
             id,
             server_id,
             organization_id,
             nom,
             description,
             notes,
             depart_centre,
             fin_centre,
             updated_at,
             dirty,
             deleted
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0);`,[u,n.id,i,n.nom,n.description??null,n.notes??null,n.depart_centre?1:0,n.fin_centre?1:0,d])}}for(let n of t)yield e.run(`UPDATE tournees
         SET deleted = 1,
             dirty = 0,
             updated_at = ?
         WHERE organization_id = ?
           AND server_id = ?;`,[new Date(n.deleted_at).getTime(),i,n.id])})}applyPulledTourneeClients(e,i,r,t){return a(this,null,function*(){for(let n of r){let o=yield e.query(`SELECT id
         FROM tournees
         WHERE organization_id = ?
           AND server_id = ?
         LIMIT 1;`,[i,n.tournee_id]),l=yield e.query(`SELECT id
         FROM clients
         WHERE organization_id = ?
           AND server_id = ?
         LIMIT 1;`,[i,n.client_id]),d=Number(o.values?.[0]?.id??0),u=Number(l.values?.[0]?.id??0);!d||!u||(yield e.run(`INSERT INTO tournee_clients(
           organization_id,
           tournee_id,
           client_id,
           actif,
           ordre,
           updated_at,
           dirty,
           deleted
         )
         VALUES (?, ?, ?, ?, ?, ?, 0, 0)
         ON CONFLICT(organization_id, tournee_id, client_id) DO UPDATE SET
           actif = excluded.actif,
           ordre = excluded.ordre,
           updated_at = excluded.updated_at,
           dirty = 0,
           deleted = 0;`,[i,d,u,n.actif?1:0,Number(n.ordre??0),new Date(n.updated_at).getTime()]))}for(let n of t){let o=yield e.query(`SELECT id
         FROM tournees
         WHERE organization_id = ?
           AND server_id = ?
         LIMIT 1;`,[i,n.tournee_id]),l=yield e.query(`SELECT id
         FROM clients
         WHERE organization_id = ?
           AND server_id = ?
         LIMIT 1;`,[i,n.client_id]),d=Number(o.values?.[0]?.id??0),u=Number(l.values?.[0]?.id??0);!d||!u||(yield e.run(`UPDATE tournee_clients
         SET deleted = 1,
             dirty = 0,
             updated_at = ?
         WHERE organization_id = ?
           AND tournee_id = ?
           AND client_id = ?;`,[new Date(n.deleted_at).getTime(),i,d,u]))}})}applyPulledAuditLogs(e,i,r){return a(this,null,function*(){for(let t of r)yield e.run(`INSERT INTO client_audit_logs (
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
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[i,t.client_id,t.client_nom,t.action,t.field??null,t.old_value??null,t.new_value??null,t.user_id??null,t.user_name??null,new Date(t.created_at).getTime()])})}applyPulledSettings(e,i,r,t){return a(this,null,function*(){for(let n of r)yield e.run(`INSERT INTO settings(
           organization_id,
           key,
           value,
           updated_at,
           dirty,
           deleted
         )
         VALUES(?, ?, ?, ?, 0, 0)
         ON CONFLICT(organization_id, key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at,
           dirty = 0,
           deleted = 0;`,[i,n.key,n.value??null,new Date(n.updated_at).getTime()]);for(let n of t)yield e.run(`UPDATE settings
         SET deleted = 1,
             dirty = 0,
             updated_at = ?
         WHERE organization_id = ?
           AND key = ?;`,[new Date(n.deleted_at).getTime(),i,n.key])})}apiGet(e){return a(this,null,function*(){return this.api.get(e)})}apiPost(e,i){return a(this,null,function*(){return this.api.post(e,i)})}getOrganizationId(){return String(this.auth.organization()?.id??"").trim()}parseJsonArray(e){if(Array.isArray(e))return e;if(typeof e!="string"||!e.trim())return[];try{let i=JSON.parse(e);return Array.isArray(i)?i:[]}catch{return[]}}toNullableNumber(e){if(e==null||e==="")return null;let i=typeof e=="number"?e:Number(e);return Number.isFinite(i)?i:null}nextId(e,i){return a(this,null,function*(){let r=yield e.query(`SELECT MAX(id) as maxId
       FROM ${i};`);return Number(r.values?.[0]?.maxId??0)+1})}};s.\u0275fac=function(i){return new(i||s)(_(h),_(E),_(w),_(f))},s.\u0275prov=p({token:s,factory:s.\u0275fac,providedIn:"root"});let c=s;return c})();export{W as a};
