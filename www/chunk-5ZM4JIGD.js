import{a as A}from"./chunk-ZFYACTOV.js";import{a as T}from"./chunk-OTVO6CYV.js";import{a as D}from"./chunk-3LHFJIOB.js";import{a as I,b as N}from"./chunk-7CP3PMW4.js";import{d as E,e as g,k as _}from"./chunk-EVOF35PR.js";import{b as O}from"./chunk-62EEP25W.js";import{a as h,b as m,g as o}from"./chunk-2R6CW7ES.js";var R=(()=>{let p=class p{constructor(t,e,n,r){this.sqlite=t,this.clientsRepo=e,this.auth=n,this.api=r,this.seededOrgs=new Set,this.memTournees=[],this.memLinks=[],this.apiBase=I.apiBase,this.webLocalIdByServerId=new Map,this.webServerIdByLocalId=new Map,this.nextWebId=1}isWeb(){return O.getPlatform()==="web"}dbOrNull(){return o(this,null,function*(){return yield this.sqlite.init()})}getOrgId(){return String(this.auth.organization()?.id??"").trim()}ensureSeedWeb(){return o(this,null,function*(){this.memTournees.length>0||(this.memTournees=[{id:1,nom:"TOURNEE A",description:"Exemple",notes:"Exemple de note",depart_centre:!0,fin_centre:!0}])})}ensureSeedDb(t){return o(this,null,function*(){let e=this.getOrgId();e&&(this.seededOrgs.has(e)||this.seededOrgs.add(e))})}getAllWithClients(){return o(this,null,function*(){if(this.isWeb())return(yield this.apiGet("/tournees")).map(w=>this.fromApiTourneeWithClients(w));let t=yield this.dbOrNull();if(!t)return[];yield this.ensureSeedDb(t);let e=this.getOrgId();if(!e)return[];let r=(yield t.query(`SELECT id, nom, description, notes, depart_centre, fin_centre
       FROM tournees
       WHERE organization_id = ?
         AND deleted = 0
       ORDER BY nom COLLATE NOCASE ASC;`,[e])).values??[],c=(yield t.query(`SELECT tournee_id, client_id, actif, ordre
       FROM tournee_clients
       WHERE organization_id = ?
         AND deleted = 0
       ORDER BY tournee_id ASC, ordre ASC;`,[e])).values??[],s=yield this.clientsRepo.getAll(),a=new Map(s.map(d=>[d.id,d])),l=new Map;for(let d of c){let w=Number(d.tournee_id),f=Number(d.client_id),y=a.get(f);if(!y)continue;let v={tourneeId:w,client:y,actif:Number(d.actif)===1,ordre:Number(d.ordre??0)},S=l.get(w)??[];S.push(v),l.set(w,S)}let u=[];for(let d of r){let w=Number(d.id);u.push({tournee:{id:w,nom:String(d.nom),description:d.description??void 0,notes:d.notes??void 0,depart_centre:Number(d.depart_centre??1)===1,fin_centre:Number(d.fin_centre??1)===1},clients:(l.get(w)??[]).slice().sort((f,y)=>(f.ordre??0)-(y.ordre??0))})}return u})}createTournee(t){return o(this,null,function*(){let e=String(t.nom??"").trim();if(!e)throw new Error("Nom obligatoire");let n=String(t.description??"").trim()||void 0,r=String(t.notes??"").trim()||void 0,i=typeof t.depart_centre=="boolean"?!!t.depart_centre:!0,c=typeof t.fin_centre=="boolean"?!!t.fin_centre:!0;if(this.isWeb()){let d=yield this.apiPost("/tournees",{nom:e,description:n??null,notes:r??null,depart_centre:i,fin_centre:c});return this.fromApiTourneeRow(d)}let s=yield this.dbOrNull();if(!s)throw new Error("SQLite indisponible");yield this.ensureSeedDb(s);let a=this.getOrgId();if(!a)throw new Error("Organisation introuvable");let l=Date.now(),u=yield this.nextIdDb(s);return yield s.run(`INSERT INTO tournees(
         organization_id,
         id,
         nom,
         description,
         notes,
         depart_centre,
         fin_centre,
         updated_at,
         dirty,
         deleted
       )
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, 1, 0);`,[a,u,e,n??null,r??null,i?1:0,c?1:0,l]),{id:u,nom:e,description:n,notes:r,depart_centre:i,fin_centre:c}})}updateTournee(t,e){return o(this,null,function*(){if(this.isWeb()){let W=this.requireWebServerId(t);yield this.apiPut(`/tournees/${W}`,h(h(h(h(h({},Object.prototype.hasOwnProperty.call(e,"nom")?{nom:e.nom}:{}),Object.prototype.hasOwnProperty.call(e,"description")?{description:e.description??null}:{}),Object.prototype.hasOwnProperty.call(e,"notes")?{notes:e.notes??null}:{}),Object.prototype.hasOwnProperty.call(e,"depart_centre")?{depart_centre:e.depart_centre}:{}),Object.prototype.hasOwnProperty.call(e,"fin_centre")?{fin_centre:e.fin_centre}:{}));return}let n=yield this.dbOrNull();if(!n)throw new Error("SQLite indisponible");yield this.ensureSeedDb(n);let r=this.getOrgId();if(!r)throw new Error("Organisation introuvable");let i=Date.now(),s=(yield n.query(`SELECT *
       FROM tournees
       WHERE organization_id = ?
         AND deleted = 0
         AND id = ?
       LIMIT 1;`,[r,t])).values?.[0];if(!s)throw new Error("Tourn\xE9e introuvable");let a=Object.prototype.hasOwnProperty.call(e,"nom"),l=Object.prototype.hasOwnProperty.call(e,"description"),u=Object.prototype.hasOwnProperty.call(e,"notes"),d=Object.prototype.hasOwnProperty.call(e,"depart_centre"),w=Object.prototype.hasOwnProperty.call(e,"fin_centre"),f=a?e.nom:s.nom,y=l?e.description??null:s.description??null,v=u?e.notes??null:s.notes??null,S=d?e.depart_centre?1:0:Number(s.depart_centre??1),L=w?e.fin_centre?1:0:Number(s.fin_centre??1);yield n.run(`UPDATE tournees
       SET nom = ?,
           description = ?,
           notes = ?,
           depart_centre = ?,
           fin_centre = ?,
           updated_at = ?,
           dirty = 1
       WHERE organization_id = ?
         AND id = ?;`,[f,y,v,S,L,i,r,t])})}removeTournee(t){return o(this,null,function*(){if(this.isWeb()){let i=this.requireWebServerId(t);yield this.apiDelete(`/tournees/${i}`),this.webServerIdByLocalId.delete(t);return}let e=yield this.dbOrNull();if(!e)throw new Error("SQLite indisponible");yield this.ensureSeedDb(e);let n=this.getOrgId();if(!n)throw new Error("Organisation introuvable");let r=Date.now();yield e.run(`UPDATE tournees
       SET deleted = 1, dirty = 1, updated_at = ?
       WHERE organization_id = ?
         AND id = ?;`,[r,n,t]),yield e.run(`UPDATE tournee_clients
       SET deleted = 1, dirty = 1, updated_at = ?
       WHERE organization_id = ?
         AND tournee_id = ?;`,[r,n,t])})}addClient(t,e){return o(this,null,function*(){let n=e.id;if(this.isWeb()){let l=this.requireWebServerId(t),u=this.clientsRepo.getServerId(n);if(!u)throw new Error(`Mapping serveur introuvable pour le client local ${n}`);yield this.apiPost(`/tournees/${l}/clients`,{clientId:u});return}let r=yield this.dbOrNull();if(!r)throw new Error("SQLite indisponible");yield this.ensureSeedDb(r);let i=this.getOrgId();if(!i)throw new Error("Organisation introuvable");let c=Date.now(),s=yield r.query(`SELECT MAX(ordre) as maxOrdre
       FROM tournee_clients
       WHERE organization_id = ?
         AND deleted = 0
         AND tournee_id = ?;`,[i,t]),a=Number(s.values?.[0]?.maxOrdre??-1)+1;yield r.run(`INSERT INTO tournee_clients(
         organization_id,
         tournee_id,
         client_id,
         actif,
         ordre,
         updated_at,
         dirty,
         deleted
       )
       VALUES(?, ?, ?, ?, ?, ?, 1, 0)
       ON CONFLICT(organization_id, tournee_id, client_id) DO UPDATE SET
         deleted = 0,
         actif = excluded.actif,
         ordre = excluded.ordre,
         updated_at = excluded.updated_at,
         dirty = 1;`,[i,t,n,1,a,c])})}removeClient(t,e){return o(this,null,function*(){if(this.isWeb()){let c=this.requireWebServerId(t),s=this.clientsRepo.getServerId(e);if(!s)throw new Error(`Mapping serveur introuvable pour le client local ${e}`);yield this.apiDelete(`/tournees/${c}/clients/${s}`);return}let n=yield this.dbOrNull();if(!n)throw new Error("SQLite indisponible");yield this.ensureSeedDb(n);let r=this.getOrgId();if(!r)throw new Error("Organisation introuvable");let i=Date.now();yield n.run(`UPDATE tournee_clients
       SET deleted = 1, dirty = 1, updated_at = ?
       WHERE organization_id = ?
         AND tournee_id = ?
         AND client_id = ?;`,[i,r,t,e])})}setActif(t,e,n){return o(this,null,function*(){if(this.isWeb()){let s=this.requireWebServerId(t),a=this.clientsRepo.getServerId(e);if(!a)throw new Error(`Mapping serveur introuvable pour le client local ${e}`);yield this.apiPatch(`/tournees/${s}/clients/${a}/actif`,{actif:n});return}let r=yield this.dbOrNull();if(!r)throw new Error("SQLite indisponible");yield this.ensureSeedDb(r);let i=this.getOrgId();if(!i)throw new Error("Organisation introuvable");let c=Date.now();yield r.run(`UPDATE tournee_clients
       SET actif = ?, updated_at = ?, dirty = 1
       WHERE organization_id = ?
         AND tournee_id = ?
         AND client_id = ?
         AND deleted = 0;`,[n?1:0,c,i,t,e])})}reorderClients(t,e){return o(this,null,function*(){if(!e||e.length===0)return;if(this.isWeb()){let u=this.requireWebServerId(t),d=e.map(w=>{let f=this.clientsRepo.getServerId(w);if(!f)throw new Error(`Mapping serveur introuvable pour le client local ${w}`);return f});yield this.apiPost(`/tournees/${u}/reorder`,{orderedClientIds:d});return}let n=yield this.dbOrNull();if(!n)throw new Error("SQLite indisponible");let r=this.getOrgId();if(!r)throw new Error("Organisation introuvable");let i=Date.now(),c=e.map(()=>"WHEN ? THEN ?").join(" "),s=e.map(()=>"?").join(","),a=`
      UPDATE tournee_clients
      SET
        ordre = CASE client_id ${c} ELSE ordre END,
        updated_at = ?,
        dirty = 1
      WHERE
        organization_id = ?
        AND deleted = 0
        AND tournee_id = ?
        AND client_id IN (${s});
    `,l=[];for(let u=0;u<e.length;u++)l.push(e[u],u);l.push(i,r,t,...e),yield n.run(a,l)})}nextIdDb(t){return o(this,null,function*(){let e=yield t.query(`SELECT MAX(id) as maxId
       FROM tournees;`);return Number(e.values?.[0]?.maxId??0)+1})}fromApiTourneeRow(t){let e=String(t?.id??"");if(!e)throw new Error("Tourn\xE9e API invalide: id serveur manquant");let n=this.webLocalIdByServerId.get(e);return n||(n=this.nextWebId++,this.webLocalIdByServerId.set(e,n),this.webServerIdByLocalId.set(n,e)),{id:n,nom:String(t?.nom??""),description:t?.description??void 0,notes:t?.notes??void 0,depart_centre:typeof t?.depart_centre=="boolean"?t.depart_centre:Number(t?.depart_centre??1)===1,fin_centre:typeof t?.fin_centre=="boolean"?t.fin_centre:Number(t?.fin_centre??1)===1}}fromApiTourneeWithClients(t){let e=this.fromApiTourneeRow(t?.tournee??t),n=(Array.isArray(t?.clients)?t.clients:[]).map(r=>{let i=this.clientsRepo.fromApiRow(r?.client??{});return{tourneeId:e.id,client:i,actif:typeof r?.actif=="boolean"?r.actif:Number(r?.actif??1)===1,ordre:Number(r?.ordre??0)}}).sort((r,i)=>(r.ordre??0)-(i.ordre??0));return{tournee:e,clients:n}}requireWebServerId(t){let e=this.webServerIdByLocalId.get(t);if(!e)throw new Error(`Mapping serveur introuvable pour la tourn\xE9e locale ${t}`);return e}apiGet(t){return o(this,null,function*(){return this.api.get(t)})}apiPost(t,e){return o(this,null,function*(){return this.api.post(t,e)})}apiPut(t,e){return o(this,null,function*(){return this.api.put(t,e)})}apiPatch(t,e){return o(this,null,function*(){return this.api.patch(t,e)})}apiDelete(t){return o(this,null,function*(){return this.api.delete(t)})}_unusedMemKeep(){return{tournees:this.memTournees,links:this.memLinks}}};p.\u0275fac=function(e){return new(e||p)(g(T),g(A),g(N),g(D))},p.\u0275prov=E({token:p,factory:p.\u0275fac,providedIn:"root"});let b=p;return b})();var k=(()=>{let p=class p{constructor(t){this.repo=t,this.loading=_(!1),this.error=_(null),this.tournees=_([])}load(){return o(this,null,function*(){this.loading.set(!0),this.error.set(null);try{let t=yield this.repo.getAllWithClients();this.tournees.set(t)}catch(t){this.error.set(String(t?.message??t))}finally{this.loading.set(!1)}})}updateTourneeLocal(t,e){this.tournees.update(n=>n.map(r=>r.tournee.id===t?e(r):r))}createTournee(t){return o(this,null,function*(){this.error.set(null);try{let e=yield this.repo.createTournee(t);e&&e.id!=null?this.tournees.update(n=>{let r=[{tournee:e,clients:[]},...n];return r.sort((i,c)=>String(i.tournee.nom??"").localeCompare(String(c.tournee.nom??""),"fr",{sensitivity:"base"})),r}):yield this.load()}catch(e){throw this.error.set(String(e?.message??e)),e}})}updateTournee(t,e){return o(this,null,function*(){this.error.set(null);let n=this.tournees();this.updateTourneeLocal(t,r=>m(h({},r),{tournee:h(h({},r.tournee),e)}));try{yield this.repo.updateTournee(t,e)}catch(r){throw this.error.set(String(r?.message??r)),this.tournees.set(n),r}})}removeTournee(t){return o(this,null,function*(){this.error.set(null);let e=this.tournees();this.tournees.set(e.filter(n=>n.tournee.id!==t));try{yield this.repo.removeTournee(t)}catch(n){throw this.error.set(String(n?.message??n)),this.tournees.set(e),n}})}addClient(t,e){return o(this,null,function*(){this.error.set(null);let n=this.tournees();this.updateTourneeLocal(t,r=>{if(r.clients.some(a=>a.client.id===e.id))return r;let c=Math.max(-1,...r.clients.map(a=>Number(a.ordre??0))),s={tourneeId:t,client:e,actif:!0,ordre:c+1};return m(h({},r),{clients:[...r.clients,s]})});try{yield this.repo.addClient(t,e)}catch(r){throw this.error.set(String(r?.message??r)),this.tournees.set(n),r}})}removeClient(t,e){return o(this,null,function*(){this.error.set(null);let n=this.tournees();this.updateTourneeLocal(t,r=>m(h({},r),{clients:r.clients.filter(i=>i.client.id!==e)}));try{yield this.repo.removeClient(t,e)}catch(r){throw this.error.set(String(r?.message??r)),this.tournees.set(n),r}})}setActif(t,e,n){return o(this,null,function*(){this.error.set(null);let r=this.tournees();this.updateTourneeLocal(t,i=>m(h({},i),{clients:i.clients.map(c=>c.client.id===e?m(h({},c),{actif:n}):c)}));try{yield this.repo.setActif(t,e,n)}catch(i){throw this.error.set(String(i?.message??i)),this.tournees.set(r),i}})}reorderClients(t,e){return o(this,null,function*(){this.error.set(null);let n=this.tournees();this.updateTourneeLocal(t,r=>{let i=new Map(r.clients.map(a=>[a.client.id,a])),c=e.map((a,l)=>{let u=i.get(a);return u?m(h({},u),{ordre:l}):null}).filter(Boolean),s=r.clients.filter(a=>!e.includes(a.client.id)).map((a,l)=>m(h({},a),{ordre:c.length+l}));return m(h({},r),{clients:[...c,...s]})});try{yield this.repo.reorderClients(t,e)}catch(r){throw this.error.set(String(r?.message??r)),this.tournees.set(n),r}})}};p.\u0275fac=function(e){return new(e||p)(g(R))},p.\u0275prov=E({token:p,factory:p.\u0275fac,providedIn:"root"});let b=p;return b})();export{k as a};
