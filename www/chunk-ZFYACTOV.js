import{a as w}from"./chunk-OTVO6CYV.js";import{a as b}from"./chunk-3LHFJIOB.js";import{b as y}from"./chunk-7CP3PMW4.js";import{d as f,e as c}from"./chunk-EVOF35PR.js";import{b as I}from"./chunk-62EEP25W.js";import{a as l,b as u,g as a}from"./chunk-2R6CW7ES.js";var m=[];var L=(()=>{let d=class d{constructor(e,i,n){this.sqlite=e,this.auth=i,this.api=n,this.memByOrg=new Map,this.seededOrgs=new Set,this.webLocalIdByServerId=new Map,this.webServerIdByLocalId=new Map,this.nextWebId=1,this.fromRow=o=>({id:Number(o.id),nom:o.nom,groupe:o.groupe??"",phone:o.phones_json?JSON.parse(o.phones_json):[],ville:o.ville??"",adresse:o.adresse??"",pays:o.pays??"",lat:typeof o.lat=="number"?o.lat:Number(o.lat??0),lng:typeof o.lng=="number"?o.lng:Number(o.lng??0),horaires:o.horaires_json?JSON.parse(o.horaires_json):[],protocole:o.protocole??"",photos:o.photos_json?JSON.parse(o.photos_json):[],actif:Number(o.actif)===1})}dbOrNull(){return a(this,null,function*(){return yield this.sqlite.init()})}isWeb(){return I.getPlatform()==="web"}getOrgId(){return String(this.auth.organization()?.id??"").trim()}getOrgRole(){return String(this.auth.organization()?.role??"").trim().toLowerCase()}canReadOrganizationAudit(){let e=this.getOrgRole();if(e==="admin"||e==="manager")return!0;let i=this.auth?.isSuperAdmin;if(typeof i=="function")try{return!!i.call(this.auth)}catch{return!1}return!1}getOrgMem(){let e=this.getOrgId();if(!e)return[];let i=this.memByOrg.get(e);if(i)return i;let n=structuredClone(m);return this.memByOrg.set(e,n),n}setOrgMem(e){let i=this.getOrgId();i&&this.memByOrg.set(i,e)}getServerId(e){return this.isWeb()?this.webServerIdByLocalId.get(e)??null:null}fromApiRow(e){let i=String(e?.id??"");if(!i)throw new Error("Client API invalide: id serveur manquant");let n=this.webLocalIdByServerId.get(i);return n||(n=this.nextWebId++,this.webLocalIdByServerId.set(i,n),this.webServerIdByLocalId.set(n,i)),{id:n,nom:String(e?.nom??""),groupe:e?.groupe??"",phone:Array.isArray(e?.phones_json)?e.phones_json:Array.isArray(e?.phone)?e.phone:[],ville:e?.ville??"",adresse:e?.adresse??"",pays:e?.pays??"",lat:this.toNumberOrZero(e?.lat),lng:this.toNumberOrZero(e?.lng),horaires:Array.isArray(e?.horaires_json)?e.horaires_json:Array.isArray(e?.horaires)?e.horaires:[],protocole:e?.protocole??"",photos:Array.isArray(e?.photos_json)?e.photos_json:Array.isArray(e?.photos)?e.photos:[],actif:typeof e?.actif=="boolean"?e.actif:Number(e?.actif??1)===1}}getCurrentUser(){let e=this.auth.user();return{userId:e?.id?String(e.id):null,userName:e?.name??null}}addAuditLog(e){return a(this,null,function*(){let i=yield this.dbOrNull();if(!i)return;let n=this.getOrgId();if(!n)return;let o=this.getCurrentUser();yield i.run(`INSERT INTO client_audit_logs (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[n,e.clientId,e.clientNom,e.action,e.field??null,e.oldValue===void 0?null:JSON.stringify(e.oldValue),e.newValue===void 0?null:JSON.stringify(e.newValue),o.userId,o.userName,Date.now()])})}getAuditLogs(){return a(this,null,function*(){if(this.canReadOrganizationAudit())try{return(yield this.apiGet("/clients/audit")).map(t=>({id:Number(t.id),organizationId:String(t.organization_id??""),clientId:this.toAuditClientId(t.client_id),clientNom:String(t.client_nom??""),action:String(t.action??"update"),field:t.field??null,oldValue:t.old_value??null,newValue:t.new_value??null,userId:t.user_id!=null?String(t.user_id):null,userName:t.user_name??null,createdAt:this.toTimestamp(t.created_at)}))}catch{}let i=yield this.dbOrNull();if(!i)return[];let n=this.getOrgId();return n?((yield i.query(`SELECT *
       FROM client_audit_logs
       WHERE organization_id = ?
       ORDER BY created_at DESC, id DESC;`,[n])).values??[]).map(r=>({id:Number(r.id),organizationId:String(r.organization_id??""),clientId:Number(r.client_id??0),clientNom:String(r.client_nom??""),action:String(r.action??"update"),field:r.field??null,oldValue:r.old_value?JSON.parse(r.old_value):null,newValue:r.new_value?JSON.parse(r.new_value):null,userId:r.user_id??null,userName:r.user_name??null,createdAt:Number(r.created_at??0)})):[]})}getAll(){return a(this,null,function*(){if(this.isWeb())return(yield this.apiGet("/clients")).map(r=>this.fromApiRow(r));let e=yield this.dbOrNull();if(!e)return structuredClone(this.getOrgMem());yield this.ensureSeed(e);let i=this.getOrgId();return i?((yield e.query(`SELECT *
       FROM clients
       WHERE organization_id = ?
         AND deleted = 0
       ORDER BY nom COLLATE NOCASE ASC;`,[i])).values??[]).map(this.fromRow):[]})}getById(e){return a(this,null,function*(){if(this.isWeb()){let t=yield this.getAll();return structuredClone(t.find(s=>s.id===e))}let i=yield this.dbOrNull();if(!i)return structuredClone(this.getOrgMem().find(t=>t.id===e));yield this.ensureSeed(i);let n=this.getOrgId();if(!n)return;let r=((yield i.query(`SELECT *
       FROM clients
       WHERE organization_id = ?
         AND deleted = 0
         AND id = ?
       LIMIT 1;`,[n,e])).values??[])[0];return r?this.fromRow(r):void 0})}setActif(e,i){return a(this,null,function*(){if(this.isWeb()){let g=this.requireWebServerId(e),p=yield this.apiPut(`/clients/${g}`,{actif:i});return this.fromApiRow(p)}let n=yield this.dbOrNull();if(!n)return this.setActifWebFallback(e,i);yield this.ensureSeed(n);let o=this.getOrgId();if(!o)throw new Error("Organisation introuvable");let r=yield this.getById(e);if(!r)throw new Error("Client introuvable");let t=Date.now();yield n.run(`UPDATE clients
       SET actif = ?, updated_at = ?, dirty = 1
       WHERE organization_id = ?
         AND id = ?
         AND deleted = 0;`,[i?1:0,t,o,e]);let s=yield this.getById(e);if(!s)throw new Error("Client introuvable");return r.actif!==s.actif&&(yield this.addAuditLog({clientId:s.id,clientNom:s.nom,action:"toggle-actif",field:"actif",oldValue:r.actif,newValue:s.actif})),s})}setActifWebFallback(e,i){return a(this,null,function*(){let n=this.getOrgMem(),o=n.findIndex(r=>r.id===e);if(o<0)throw new Error("Client introuvable");return n[o]=u(l({},n[o]),{actif:i}),this.setOrgMem(n),structuredClone(n[o])})}create(e){return a(this,null,function*(){if(this.isWeb()){let s=yield this.apiPost("/clients",this.toApiPayload(e));return this.fromApiRow(s)}let i=yield this.dbOrNull();if(!i)return this.createWebFallback(e);yield this.ensureSeed(i);let n=this.getOrgId();if(!n)throw new Error("Organisation introuvable");let o=Date.now(),r=yield this.nextIdDb(i,n),t=l({id:r},structuredClone(e));return yield i.run(`INSERT INTO clients (
        organization_id,
        id,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0);`,[n,t.id,t.nom,t.groupe??null,t.ville??null,t.adresse??null,t.pays??null,t.lat??null,t.lng??null,JSON.stringify(t.phone??[]),JSON.stringify(t.horaires??[]),t.protocole??null,JSON.stringify(t.photos??[]),t.actif?1:0,o]),yield this.addAuditLog({clientId:t.id,clientNom:t.nom,action:"create",newValue:t}),t})}createWebFallback(e){return a(this,null,function*(){let i=this.getOrgMem(),n=this.nextIdMem(i),o=l({id:n},structuredClone(e));return this.setOrgMem([o,...i]),structuredClone(o)})}update(e,i){return a(this,null,function*(){if(this.isWeb()){let g=this.requireWebServerId(e),p=yield this.apiPut(`/clients/${g}`,this.toApiPayload(i));return this.fromApiRow(p)}let n=yield this.dbOrNull();if(!n)return this.updateWebFallback(e,i);yield this.ensureSeed(n);let o=this.getOrgId();if(!o)throw new Error("Organisation introuvable");let r=yield this.getById(e);if(!r)throw new Error("Client introuvable");let t=u(l(l({},r),structuredClone(i)),{id:e}),s=Date.now();return yield n.run(`UPDATE clients
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
           dirty = 1,
           deleted = 0
       WHERE organization_id = ?
         AND id = ?;`,[t.nom,t.groupe??null,t.ville??null,t.adresse??null,t.pays??null,t.lat??null,t.lng??null,JSON.stringify(t.phone??[]),JSON.stringify(t.horaires??[]),t.protocole??null,JSON.stringify(t.photos??[]),t.actif?1:0,s,o,e]),r.nom!==t.nom&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"nom",oldValue:r.nom,newValue:t.nom})),r.groupe!==t.groupe&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"groupe",oldValue:r.groupe,newValue:t.groupe})),r.ville!==t.ville&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"ville",oldValue:r.ville,newValue:t.ville})),r.adresse!==t.adresse&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"adresse",oldValue:r.adresse,newValue:t.adresse})),r.pays!==t.pays&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"pays",oldValue:r.pays,newValue:t.pays})),r.lat!==t.lat&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"lat",oldValue:r.lat,newValue:t.lat})),r.lng!==t.lng&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"lng",oldValue:r.lng,newValue:t.lng})),r.protocole!==t.protocole&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"protocole",oldValue:r.protocole,newValue:t.protocole})),r.actif!==t.actif&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"actif",oldValue:r.actif,newValue:t.actif})),JSON.stringify(r.phone??[])!==JSON.stringify(t.phone??[])&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"phone",oldValue:r.phone??[],newValue:t.phone??[]})),JSON.stringify(r.horaires??[])!==JSON.stringify(t.horaires??[])&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"horaires",oldValue:r.horaires??[],newValue:t.horaires??[]})),JSON.stringify(r.photos??[])!==JSON.stringify(t.photos??[])&&(yield this.addAuditLog({clientId:e,clientNom:t.nom,action:"update",field:"photos",oldValue:r.photos??[],newValue:t.photos??[]})),t})}updateWebFallback(e,i){return a(this,null,function*(){let n=this.getOrgMem(),o=n.findIndex(t=>t.id===e);if(o<0)throw new Error("Client introuvable");let r=u(l(l({},n[o]),structuredClone(i)),{id:e});return n[o]=r,this.setOrgMem(n),structuredClone(r)})}remove(e){return a(this,null,function*(){if(this.isWeb()){let t=this.requireWebServerId(e);yield this.apiDelete(`/clients/${t}`),this.webServerIdByLocalId.delete(e);return}let i=yield this.dbOrNull();if(!i)return this.removeWebFallback(e);yield this.ensureSeed(i);let n=this.getOrgId();if(!n)throw new Error("Organisation introuvable");let o=yield this.getById(e);if(!o)throw new Error("Client introuvable");let r=Date.now();yield this.addAuditLog({clientId:e,clientNom:o.nom,action:"delete",oldValue:o}),yield i.run(`UPDATE clients
       SET deleted = 1, updated_at = ?, dirty = 1
       WHERE organization_id = ?
         AND id = ?;`,[r,n,e])})}removeWebFallback(e){return a(this,null,function*(){let i=this.getOrgMem(),n=i.findIndex(o=>o.id===e);if(n<0)throw new Error("Client introuvable");i.splice(n,1),this.setOrgMem(i)})}ensureSeed(e){return a(this,null,function*(){let i=this.getOrgId();if(!i||this.seededOrgs.has(i))return;let n=yield e.query(`SELECT COUNT(1) as cnt
       FROM clients
       WHERE organization_id = ?;`,[i]);if(Number(n.values?.[0]?.cnt??0)===0){let r=Date.now();for(let t of m)yield e.run(`INSERT INTO clients (
            organization_id,
            id,
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0);`,[i,t.id,t.nom,t.groupe??null,t.ville??null,t.adresse??null,t.pays??null,t.lat??null,t.lng??null,JSON.stringify(t.phone??[]),JSON.stringify(t.horaires??[]),t.protocole??null,JSON.stringify(t.photos??[]),t.actif?1:0,r])}this.seededOrgs.add(i)})}nextIdMem(e){return e.reduce((n,o)=>Math.max(n,Number(o?.id??0)),0)+1}nextIdDb(e,i){return a(this,null,function*(){let n=yield e.query(`SELECT MAX(id) as maxId
       FROM clients
       WHERE organization_id = ?;`,[i]);return Number(n.values?.[0]?.maxId??0)+1})}toApiPayload(e){return{nom:e.nom,groupe:e.groupe??null,ville:e.ville??null,adresse:e.adresse??null,pays:e.pays??null,lat:e.lat??null,lng:e.lng??null,phone:Array.isArray(e.phone)?e.phone:void 0,horaires:Array.isArray(e.horaires)?e.horaires:void 0,protocole:e.protocole??null,photos:Array.isArray(e.photos)?e.photos:void 0,actif:typeof e.actif=="boolean"?e.actif:void 0}}requireWebServerId(e){let i=this.webServerIdByLocalId.get(e);if(!i)throw new Error(`Mapping serveur introuvable pour le client local ${e}`);return i}toNumberOrZero(e){let i=typeof e=="number"?e:Number(e??0);return Number.isFinite(i)?i:0}toAuditClientId(e){let i=String(e??"").trim();if(!i)return 0;let n=this.webLocalIdByServerId.get(i);if(n)return n;let o=Number(i);return Number.isFinite(o)?o:0}toTimestamp(e){if(typeof e=="number")return e;let n=new Date(String(e??"")).getTime();return Number.isFinite(n)?n:Date.now()}apiGet(e){return a(this,null,function*(){return this.api.get(e)})}apiPost(e,i){return a(this,null,function*(){return this.api.post(e,i)})}apiPut(e,i){return a(this,null,function*(){return this.api.put(e,i)})}apiDelete(e){return a(this,null,function*(){return this.api.delete(e)})}};d.\u0275fac=function(i){return new(i||d)(c(w),c(y),c(b))},d.\u0275prov=f({token:d,factory:d.\u0275fac,providedIn:"root"});let h=d;return h})();export{L as a};
