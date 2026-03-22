import{d as u}from"./chunk-EVOF35PR.js";import{b as N,c as h}from"./chunk-62EEP25W.js";import{g as r}from"./chunk-2R6CW7ES.js";var E=class{constructor(e){this.sqlite=e,this._connectionDict=new Map}initWebStore(){return r(this,null,function*(){try{return yield this.sqlite.initWebStore(),Promise.resolve()}catch(e){return Promise.reject(e)}})}saveToStore(e){return r(this,null,function*(){try{return yield this.sqlite.saveToStore({database:e}),Promise.resolve()}catch(i){return Promise.reject(i)}})}saveToLocalDisk(e){return r(this,null,function*(){try{return yield this.sqlite.saveToLocalDisk({database:e}),Promise.resolve()}catch(i){return Promise.reject(i)}})}getFromLocalDiskToStore(e){return r(this,null,function*(){let i=e??!0;try{return yield this.sqlite.getFromLocalDiskToStore({overwrite:i}),Promise.resolve()}catch(t){return Promise.reject(t)}})}echo(e){return r(this,null,function*(){try{let i=yield this.sqlite.echo({value:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}isSecretStored(){return r(this,null,function*(){try{let e=yield this.sqlite.isSecretStored();return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}setEncryptionSecret(e){return r(this,null,function*(){try{return yield this.sqlite.setEncryptionSecret({passphrase:e}),Promise.resolve()}catch(i){return Promise.reject(i)}})}changeEncryptionSecret(e,i){return r(this,null,function*(){try{return yield this.sqlite.changeEncryptionSecret({passphrase:e,oldpassphrase:i}),Promise.resolve()}catch(t){return Promise.reject(t)}})}clearEncryptionSecret(){return r(this,null,function*(){try{return yield this.sqlite.clearEncryptionSecret(),Promise.resolve()}catch(e){return Promise.reject(e)}})}checkEncryptionSecret(e){return r(this,null,function*(){try{let i=yield this.sqlite.checkEncryptionSecret({passphrase:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}addUpgradeStatement(e,i){return r(this,null,function*(){try{return e.endsWith(".db")&&(e=e.slice(0,-3)),yield this.sqlite.addUpgradeStatement({database:e,upgrade:i}),Promise.resolve()}catch(t){return Promise.reject(t)}})}createConnection(e,i,t,s,n){return r(this,null,function*(){try{e.endsWith(".db")&&(e=e.slice(0,-3)),yield this.sqlite.createConnection({database:e,encrypted:i,mode:t,version:s,readonly:n});let a=new d(e,n,this.sqlite),o=n?`RO_${e}`:`RW_${e}`;return this._connectionDict.set(o,a),Promise.resolve(a)}catch(a){return Promise.reject(a)}})}closeConnection(e,i){return r(this,null,function*(){try{e.endsWith(".db")&&(e=e.slice(0,-3)),yield this.sqlite.closeConnection({database:e,readonly:i});let t=i?`RO_${e}`:`RW_${e}`;return this._connectionDict.delete(t),Promise.resolve()}catch(t){return Promise.reject(t)}})}isConnection(e,i){return r(this,null,function*(){let t={};e.endsWith(".db")&&(e=e.slice(0,-3));let s=i?`RO_${e}`:`RW_${e}`;return t.result=this._connectionDict.has(s),Promise.resolve(t)})}retrieveConnection(e,i){return r(this,null,function*(){e.endsWith(".db")&&(e=e.slice(0,-3));let t=i?`RO_${e}`:`RW_${e}`;if(this._connectionDict.has(t)){let s=this._connectionDict.get(t);return typeof s<"u"?Promise.resolve(s):Promise.reject(`Connection ${e} is undefined`)}else return Promise.reject(`Connection ${e} does not exist`)})}getNCDatabasePath(e,i){return r(this,null,function*(){try{let t=yield this.sqlite.getNCDatabasePath({path:e,database:i});return Promise.resolve(t)}catch(t){return Promise.reject(t)}})}createNCConnection(e,i){return r(this,null,function*(){try{yield this.sqlite.createNCConnection({databasePath:e,version:i});let t=new d(e,!0,this.sqlite),s=`RO_${e})`;return this._connectionDict.set(s,t),Promise.resolve(t)}catch(t){return Promise.reject(t)}})}closeNCConnection(e){return r(this,null,function*(){try{yield this.sqlite.closeNCConnection({databasePath:e});let i=`RO_${e})`;return this._connectionDict.delete(i),Promise.resolve()}catch(i){return Promise.reject(i)}})}isNCConnection(e){return r(this,null,function*(){let i={},t=`RO_${e})`;return i.result=this._connectionDict.has(t),Promise.resolve(i)})}retrieveNCConnection(e){return r(this,null,function*(){if(this._connectionDict.has(e)){let i=`RO_${e})`,t=this._connectionDict.get(i);return typeof t<"u"?Promise.resolve(t):Promise.reject(`Connection ${e} is undefined`)}else return Promise.reject(`Connection ${e} does not exist`)})}isNCDatabase(e){return r(this,null,function*(){try{let i=yield this.sqlite.isNCDatabase({databasePath:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}retrieveAllConnections(){return r(this,null,function*(){return this._connectionDict})}closeAllConnections(){return r(this,null,function*(){let e=new Map;try{for(let i of this._connectionDict.keys()){let t=i.substring(3),s=i.substring(0,3)==="RO_";yield this.sqlite.closeConnection({database:t,readonly:s}),e.set(i,null)}for(let i of e.keys())this._connectionDict.delete(i);return Promise.resolve()}catch(i){return Promise.reject(i)}})}checkConnectionsConsistency(){return r(this,null,function*(){try{let e=[...this._connectionDict.keys()],i=[],t=[];for(let n of e)i.push(n.substring(0,2)),t.push(n.substring(3));let s=yield this.sqlite.checkConnectionsConsistency({dbNames:t,openModes:i});return s.result||(this._connectionDict=new Map),Promise.resolve(s)}catch(e){return this._connectionDict=new Map,Promise.reject(e)}})}importFromJson(e){return r(this,null,function*(){try{let i=yield this.sqlite.importFromJson({jsonstring:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}isJsonValid(e){return r(this,null,function*(){try{let i=yield this.sqlite.isJsonValid({jsonstring:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}copyFromAssets(e){return r(this,null,function*(){let i=e??!0;try{return yield this.sqlite.copyFromAssets({overwrite:i}),Promise.resolve()}catch(t){return Promise.reject(t)}})}getFromHTTPRequest(e,i){return r(this,null,function*(){let t=i??!0;try{return yield this.sqlite.getFromHTTPRequest({url:e,overwrite:t}),Promise.resolve()}catch(s){return Promise.reject(s)}})}isDatabaseEncrypted(e){return r(this,null,function*(){e.endsWith(".db")&&(e=e.slice(0,-3));try{let i=yield this.sqlite.isDatabaseEncrypted({database:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}isInConfigEncryption(){return r(this,null,function*(){try{let e=yield this.sqlite.isInConfigEncryption();return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}isInConfigBiometricAuth(){return r(this,null,function*(){try{let e=yield this.sqlite.isInConfigBiometricAuth();return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}isDatabase(e){return r(this,null,function*(){e.endsWith(".db")&&(e=e.slice(0,-3));try{let i=yield this.sqlite.isDatabase({database:e});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}getDatabaseList(){return r(this,null,function*(){try{let i=(yield this.sqlite.getDatabaseList()).values;i.sort();let t={values:i};return Promise.resolve(t)}catch(e){return Promise.reject(e)}})}getMigratableDbList(e){return r(this,null,function*(){let i=e||"default";try{let t=yield this.sqlite.getMigratableDbList({folderPath:i});return Promise.resolve(t)}catch(t){return Promise.reject(t)}})}addSQLiteSuffix(e,i){return r(this,null,function*(){let t=e||"default",s=i||[];try{let n=yield this.sqlite.addSQLiteSuffix({folderPath:t,dbNameList:s});return Promise.resolve(n)}catch(n){return Promise.reject(n)}})}deleteOldDatabases(e,i){return r(this,null,function*(){let t=e||"default",s=i||[];try{let n=yield this.sqlite.deleteOldDatabases({folderPath:t,dbNameList:s});return Promise.resolve(n)}catch(n){return Promise.reject(n)}})}moveDatabasesAndAddSuffix(e,i){return r(this,null,function*(){let t=e||"default",s=i||[];return this.sqlite.moveDatabasesAndAddSuffix({folderPath:t,dbNameList:s})})}},d=class{constructor(e,i,t){this.dbName=e,this.readonly=i,this.sqlite=t}getConnectionDBName(){return this.dbName}getConnectionReadOnly(){return this.readonly}open(){return r(this,null,function*(){try{return yield this.sqlite.open({database:this.dbName,readonly:this.readonly}),Promise.resolve()}catch(e){return Promise.reject(e)}})}close(){return r(this,null,function*(){try{return yield this.sqlite.close({database:this.dbName,readonly:this.readonly}),Promise.resolve()}catch(e){return Promise.reject(e)}})}beginTransaction(){return r(this,null,function*(){try{let e=yield this.sqlite.beginTransaction({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}commitTransaction(){return r(this,null,function*(){try{let e=yield this.sqlite.commitTransaction({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}rollbackTransaction(){return r(this,null,function*(){try{let e=yield this.sqlite.rollbackTransaction({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}isTransactionActive(){return r(this,null,function*(){try{let e=yield this.sqlite.isTransactionActive({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}loadExtension(e){return r(this,null,function*(){try{return yield this.sqlite.loadExtension({database:this.dbName,path:e,readonly:this.readonly}),Promise.resolve()}catch(i){return Promise.reject(i)}})}enableLoadExtension(e){return r(this,null,function*(){try{return yield this.sqlite.enableLoadExtension({database:this.dbName,toggle:e,readonly:this.readonly}),Promise.resolve()}catch(i){return Promise.reject(i)}})}getUrl(){return r(this,null,function*(){try{let e=yield this.sqlite.getUrl({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}getVersion(){return r(this,null,function*(){try{let e=yield this.sqlite.getVersion({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}getTableList(){return r(this,null,function*(){try{let e=yield this.sqlite.getTableList({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}execute(e,i=!0,t=!0){return r(this,null,function*(){try{if(this.readonly)return Promise.reject("not allowed in read-only mode");{let s=yield this.sqlite.execute({database:this.dbName,statements:e,transaction:i,readonly:!1,isSQL92:t});return Promise.resolve(s)}}catch(s){return Promise.reject(s)}})}query(e,i,t=!0){return r(this,null,function*(){let s;try{return i&&i.length>0?s=yield this.sqlite.query({database:this.dbName,statement:e,values:i,readonly:this.readonly,isSQL92:!0}):s=yield this.sqlite.query({database:this.dbName,statement:e,values:[],readonly:this.readonly,isSQL92:t}),s=yield this.reorderRows(s),Promise.resolve(s)}catch(n){return Promise.reject(n)}})}run(e,i,t=!0,s="no",n=!0){return r(this,null,function*(){let a;try{return this.readonly?Promise.reject("not allowed in read-only mode"):(i&&i.length>0?a=yield this.sqlite.run({database:this.dbName,statement:e,values:i,transaction:t,readonly:!1,returnMode:s,isSQL92:!0}):a=yield this.sqlite.run({database:this.dbName,statement:e,values:[],transaction:t,readonly:!1,returnMode:s,isSQL92:n}),a.changes=yield this.reorderRows(a.changes),Promise.resolve(a))}catch(o){return Promise.reject(o)}})}executeSet(e,i=!0,t="no",s=!0){return r(this,null,function*(){let n;try{return this.readonly?Promise.reject("not allowed in read-only mode"):(n=yield this.sqlite.executeSet({database:this.dbName,set:e,transaction:i,readonly:!1,returnMode:t,isSQL92:s}),n.changes=yield this.reorderRows(n.changes),Promise.resolve(n))}catch(a){return Promise.reject(a)}})}isExists(){return r(this,null,function*(){try{let e=yield this.sqlite.isDBExists({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}isTable(e){return r(this,null,function*(){try{let i=yield this.sqlite.isTableExists({database:this.dbName,table:e,readonly:this.readonly});return Promise.resolve(i)}catch(i){return Promise.reject(i)}})}isDBOpen(){return r(this,null,function*(){try{let e=yield this.sqlite.isDBOpen({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}})}delete(){return r(this,null,function*(){try{return this.readonly?Promise.reject("not allowed in read-only mode"):(yield this.sqlite.deleteDatabase({database:this.dbName,readonly:!1}),Promise.resolve())}catch(e){return Promise.reject(e)}})}createSyncTable(){return r(this,null,function*(){try{if(this.readonly)return Promise.reject("not allowed in read-only mode");{let e=yield this.sqlite.createSyncTable({database:this.dbName,readonly:!1});return Promise.resolve(e)}}catch(e){return Promise.reject(e)}})}setSyncDate(e){return r(this,null,function*(){try{return this.readonly?Promise.reject("not allowed in read-only mode"):(yield this.sqlite.setSyncDate({database:this.dbName,syncdate:e,readonly:!1}),Promise.resolve())}catch(i){return Promise.reject(i)}})}getSyncDate(){return r(this,null,function*(){try{let e=yield this.sqlite.getSyncDate({database:this.dbName,readonly:this.readonly}),i="";return e.syncDate>0&&(i=new Date(e.syncDate*1e3).toISOString()),Promise.resolve(i)}catch(e){return Promise.reject(e)}})}exportToJson(e,i=!1){return r(this,null,function*(){try{let t=yield this.sqlite.exportToJson({database:this.dbName,jsonexportmode:e,readonly:this.readonly,encrypted:i});return Promise.resolve(t)}catch(t){return Promise.reject(t)}})}deleteExportedRows(){return r(this,null,function*(){try{return this.readonly?Promise.reject("not allowed in read-only mode"):(yield this.sqlite.deleteExportedRows({database:this.dbName,readonly:!1}),Promise.resolve())}catch(e){return Promise.reject(e)}})}executeTransaction(e,i=!0){return r(this,null,function*(){let t=0,s=!1;if(this.readonly)return Promise.reject("not allowed in read-only mode");if(yield this.sqlite.beginTransaction({database:this.dbName}),s=yield this.sqlite.isTransactionActive({database:this.dbName}),!s)return Promise.reject("After Begin Transaction, no transaction active");try{for(let o of e){if(typeof o!="object"||!("statement"in o))throw new Error("Error a task.statement must be provided");if("values"in o&&o.values&&o.values.length>0){let l=o.statement.toUpperCase().includes("RETURNING")?"all":"no",T=yield this.sqlite.run({database:this.dbName,statement:o.statement,values:o.values,transaction:!1,readonly:!1,returnMode:l,isSQL92:i});if(T.changes.changes<0)throw new Error("Error in transaction method run ");t+=T.changes.changes}else{let l=yield this.sqlite.execute({database:this.dbName,statements:o.statement,transaction:!1,readonly:!1});if(l.changes.changes<0)throw new Error("Error in transaction method execute ");t+=l.changes.changes}}let n=yield this.sqlite.commitTransaction({database:this.dbName});t+=n.changes.changes;let a={changes:{changes:t}};return Promise.resolve(a)}catch(n){let a=n.message?n.message:n;return yield this.sqlite.rollbackTransaction({database:this.dbName}),Promise.reject(a)}})}reorderRows(e){return r(this,null,function*(){let i=e;if(e?.values&&typeof e.values[0]=="object"&&Object.keys(e.values[0]).includes("ios_columns")){let t=e.values[0].ios_columns,s=[];for(let n=1;n<e.values.length;n++){let a=e.values[n],o={};for(let l of t)o[l]=a[l];s.push(o)}i.values=s}return Promise.resolve(i)})}};var _=h("CapacitorSQLite",{web:()=>import("./chunk-F5EC2VMV.js").then(c=>new c.CapacitorSQLiteWeb),electron:()=>window.CapacitorCustomPlatform.plugins.CapacitorSQLite});var A=(()=>{let e=class e{constructor(){this.sqlite=new E(_),this.dbName="temis_opslog",this.dbVersion=5}init(){return r(this,null,function*(){return this.db?this.db:N.getPlatform()==="web"?null:(this.db=yield this.sqlite.createConnection(this.dbName,!1,"no-encryption",this.dbVersion,!1),yield this.db.open(),yield this.db.execute("PRAGMA foreign_keys = ON;"),yield this.migrate(),this.db)})}get connection(){if(!this.db)throw new Error("SQLite not initialized. Call init() first.");return this.db}migrate(){return r(this,null,function*(){let t=this.connection;yield t.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY,
        server_id TEXT,
        organization_id TEXT NOT NULL DEFAULT '',

        nom TEXT NOT NULL,
        groupe TEXT,
        ville TEXT,
        adresse TEXT,
        pays TEXT,
        lat REAL,
        lng REAL,

        phones_json TEXT,
        horaires_json TEXT,
        protocole TEXT,
        photos_json TEXT,

        actif INTEGER NOT NULL DEFAULT 1,

        updated_at INTEGER NOT NULL,
        dirty INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
      CREATE INDEX IF NOT EXISTS idx_clients_actif ON clients(actif);
      CREATE INDEX IF NOT EXISTS idx_clients_deleted ON clients(deleted);
      CREATE INDEX IF NOT EXISTS idx_clients_updated ON clients(updated_at);

      CREATE TABLE IF NOT EXISTS client_audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization_id TEXT NOT NULL DEFAULT '',
          client_id INTEGER NOT NULL,
          client_nom TEXT NOT NULL,

          action TEXT NOT NULL,
          field TEXT,
          old_value TEXT,
          new_value TEXT,

          user_id TEXT,
          user_name TEXT,

          created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_org
          ON client_audit_logs(organization_id);

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_client
          ON client_audit_logs(client_id);

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_created
          ON client_audit_logs(created_at);

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_action
          ON client_audit_logs(action);

      CREATE TABLE IF NOT EXISTS tournees (
        id INTEGER PRIMARY KEY,
        server_id TEXT,
        organization_id TEXT NOT NULL DEFAULT '',

        nom TEXT NOT NULL,
        description TEXT,
        notes TEXT,

        depart_centre INTEGER NOT NULL DEFAULT 1,
        fin_centre INTEGER NOT NULL DEFAULT 1,

        updated_at INTEGER NOT NULL,
        dirty INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_tournees_org ON tournees(organization_id);
      CREATE INDEX IF NOT EXISTS idx_tournees_deleted ON tournees(deleted);
      CREATE INDEX IF NOT EXISTS idx_tournees_updated ON tournees(updated_at);

      CREATE TABLE IF NOT EXISTS tournee_clients (
        organization_id TEXT NOT NULL DEFAULT '',
        tournee_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,

        actif INTEGER NOT NULL DEFAULT 1,
        ordre INTEGER NOT NULL DEFAULT 0,

        updated_at INTEGER NOT NULL,
        dirty INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,

        PRIMARY KEY (organization_id, tournee_id, client_id),
        FOREIGN KEY (tournee_id) REFERENCES tournees(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tc_org ON tournee_clients(organization_id);
      CREATE INDEX IF NOT EXISTS idx_tc_tournee ON tournee_clients(tournee_id);
      CREATE INDEX IF NOT EXISTS idx_tc_client ON tournee_clients(client_id);
      CREATE INDEX IF NOT EXISTS idx_tc_deleted ON tournee_clients(deleted);
      CREATE INDEX IF NOT EXISTS idx_tc_updated ON tournee_clients(updated_at);
    `),yield this.ensureColumn(t,"clients","server_id","TEXT"),yield this.ensureColumn(t,"clients","organization_id","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"clients","updated_at","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"clients","dirty","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"clients","deleted","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"clients","actif","INTEGER NOT NULL DEFAULT 1"),yield t.execute(`
      CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
      CREATE INDEX IF NOT EXISTS idx_clients_actif ON clients(actif);
      CREATE INDEX IF NOT EXISTS idx_clients_deleted ON clients(deleted);
      CREATE INDEX IF NOT EXISTS idx_clients_updated ON clients(updated_at);
    `),yield this.ensureColumn(t,"client_audit_logs","organization_id","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"client_audit_logs","client_id","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"client_audit_logs","client_nom","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"client_audit_logs","action","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"client_audit_logs","field","TEXT"),yield this.ensureColumn(t,"client_audit_logs","old_value","TEXT"),yield this.ensureColumn(t,"client_audit_logs","new_value","TEXT"),yield this.ensureColumn(t,"client_audit_logs","user_id","TEXT"),yield this.ensureColumn(t,"client_audit_logs","user_name","TEXT"),yield this.ensureColumn(t,"client_audit_logs","created_at","INTEGER NOT NULL DEFAULT 0"),yield t.execute(`
        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_org
          ON client_audit_logs(organization_id);

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_client
          ON client_audit_logs(client_id);

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_created
          ON client_audit_logs(created_at);

        CREATE INDEX IF NOT EXISTS idx_client_audit_logs_action
          ON client_audit_logs(action);
      `),yield this.ensureColumn(t,"tournees","server_id","TEXT"),yield this.ensureColumn(t,"tournees","notes","TEXT"),yield this.ensureColumn(t,"tournees","organization_id","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"tournees","depart_centre","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"tournees","fin_centre","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"tournees","updated_at","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"tournees","dirty","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"tournees","deleted","INTEGER NOT NULL DEFAULT 0"),yield t.execute(`
      CREATE INDEX IF NOT EXISTS idx_tournees_org ON tournees(organization_id);
      CREATE INDEX IF NOT EXISTS idx_tournees_deleted ON tournees(deleted);
      CREATE INDEX IF NOT EXISTS idx_tournees_updated ON tournees(updated_at);
    `),yield this.migrateTourneeClientsTable(t),yield this.migrateSettingsTable(t)})}migrateTourneeClientsTable(t){return r(this,null,function*(){if(!(yield this.tableExists(t,"tournee_clients"))){yield t.execute(`
        CREATE TABLE IF NOT EXISTS tournee_clients (
          organization_id TEXT NOT NULL DEFAULT '',
          tournee_id INTEGER NOT NULL,
          client_id INTEGER NOT NULL,

          actif INTEGER NOT NULL DEFAULT 1,
          ordre INTEGER NOT NULL DEFAULT 0,

          updated_at INTEGER NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 1,
          deleted INTEGER NOT NULL DEFAULT 0,

          PRIMARY KEY (organization_id, tournee_id, client_id),
          FOREIGN KEY (tournee_id) REFERENCES tournees(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tc_org ON tournee_clients(organization_id);
        CREATE INDEX IF NOT EXISTS idx_tc_tournee ON tournee_clients(tournee_id);
        CREATE INDEX IF NOT EXISTS idx_tc_client ON tournee_clients(client_id);
        CREATE INDEX IF NOT EXISTS idx_tc_deleted ON tournee_clients(deleted);
        CREATE INDEX IF NOT EXISTS idx_tc_updated ON tournee_clients(updated_at);
      `);return}(yield this.getTableColumns(t,"tournee_clients")).includes("organization_id")||(yield t.execute(`
        ALTER TABLE tournee_clients RENAME TO tournee_clients_old;
      `),yield t.execute(`
        CREATE TABLE tournee_clients (
          organization_id TEXT NOT NULL DEFAULT '',
          tournee_id INTEGER NOT NULL,
          client_id INTEGER NOT NULL,

          actif INTEGER NOT NULL DEFAULT 1,
          ordre INTEGER NOT NULL DEFAULT 0,

          updated_at INTEGER NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 1,
          deleted INTEGER NOT NULL DEFAULT 0,

          PRIMARY KEY (organization_id, tournee_id, client_id),
          FOREIGN KEY (tournee_id) REFERENCES tournees(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );
      `),yield t.execute(`
        INSERT INTO tournee_clients (
          organization_id,
          tournee_id,
          client_id,
          actif,
          ordre,
          updated_at,
          dirty,
          deleted
        )
        SELECT
          COALESCE(t.organization_id, ''),
          old.tournee_id,
          old.client_id,
          old.actif,
          old.ordre,
          old.updated_at,
          old.dirty,
          old.deleted
        FROM tournee_clients_old old
        LEFT JOIN tournees t ON t.id = old.tournee_id;
      `),yield t.execute(`
        DROP TABLE tournee_clients_old;
      `)),yield this.ensureColumn(t,"tournee_clients","organization_id","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"tournee_clients","actif","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"tournee_clients","ordre","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"tournee_clients","updated_at","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"tournee_clients","dirty","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"tournee_clients","deleted","INTEGER NOT NULL DEFAULT 0"),yield t.execute(`
      CREATE INDEX IF NOT EXISTS idx_tc_org ON tournee_clients(organization_id);
      CREATE INDEX IF NOT EXISTS idx_tc_tournee ON tournee_clients(tournee_id);
      CREATE INDEX IF NOT EXISTS idx_tc_client ON tournee_clients(client_id);
      CREATE INDEX IF NOT EXISTS idx_tc_deleted ON tournee_clients(deleted);
      CREATE INDEX IF NOT EXISTS idx_tc_updated ON tournee_clients(updated_at);
    `)})}migrateSettingsTable(t){return r(this,null,function*(){if(!(yield this.tableExists(t,"settings"))){yield t.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          organization_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT,

          updated_at INTEGER NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 1,
          deleted INTEGER NOT NULL DEFAULT 0,

          PRIMARY KEY (organization_id, key)
        );

        CREATE INDEX IF NOT EXISTS idx_settings_org ON settings(organization_id);
        CREATE INDEX IF NOT EXISTS idx_settings_deleted ON settings(deleted);
        CREATE INDEX IF NOT EXISTS idx_settings_updated ON settings(updated_at);
      `);return}(yield this.getTableColumns(t,"settings")).includes("organization_id")||(yield t.execute(`
        ALTER TABLE settings RENAME TO settings_old;
      `),yield t.execute(`
        CREATE TABLE settings (
          organization_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT,

          updated_at INTEGER NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 1,
          deleted INTEGER NOT NULL DEFAULT 0,

          PRIMARY KEY (organization_id, key)
        );
      `),yield t.execute(`
        INSERT INTO settings (organization_id, key, value, updated_at, dirty, deleted)
        SELECT '', key, value, updated_at, dirty, deleted
        FROM settings_old;
      `),yield t.execute(`
        DROP TABLE settings_old;
      `)),yield this.ensureColumn(t,"settings","organization_id","TEXT NOT NULL DEFAULT ''"),yield this.ensureColumn(t,"settings","value","TEXT"),yield this.ensureColumn(t,"settings","updated_at","INTEGER NOT NULL DEFAULT 0"),yield this.ensureColumn(t,"settings","dirty","INTEGER NOT NULL DEFAULT 1"),yield this.ensureColumn(t,"settings","deleted","INTEGER NOT NULL DEFAULT 0"),yield t.execute(`
      CREATE INDEX IF NOT EXISTS idx_settings_org ON settings(organization_id);
      CREATE INDEX IF NOT EXISTS idx_settings_deleted ON settings(deleted);
      CREATE INDEX IF NOT EXISTS idx_settings_updated ON settings(updated_at);
    `)})}ensureColumn(t,s,n,a){return r(this,null,function*(){let o=yield this.getTableColumns(t,s);o.length&&(o.includes(n)||(yield t.execute(`ALTER TABLE ${s} ADD COLUMN ${n} ${a};`)))})}getTableColumns(t,s){return r(this,null,function*(){return((yield t.query(`PRAGMA table_info(${s});`)).values??[]).map(a=>String(a.name))})}tableExists(t,s){return r(this,null,function*(){return((yield t.query(`SELECT name
       FROM sqlite_master
       WHERE type='table' AND name=?;`,[s])).values?.length??0)>0})}};e.\u0275fac=function(s){return new(s||e)},e.\u0275prov=u({token:e,factory:e.\u0275fac,providedIn:"root"});let c=e;return c})();export{A as a};
