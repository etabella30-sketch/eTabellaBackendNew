export const tableQueries = {
  users: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        cFname TEXT NOT NULL,
        cLname TEXT NOT NULL,
        nUserid TEXT NOT NULL,
        cEmail TEXT NOT NULL,
        cIsvarify TEXT NOT NULL,
        isAdmin BOOLEAN NOT NULL DEFAULT 0,
        UNIQUE (cEmail) -- Add a unique constraint on the combination
      )
    `,
  sessions: `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        nUserid TEXT NOT NULL,
        nSesid INTEGER,
        nRTSid TEXT,
        cName TEXT NOT NULL,
        cUnicuserid TEXT,
        cCaseno TEXT NOT NULL,
        dStartDt TEXT NOT NULL,
        nDays INTEGER NOT NULL,
        nLines INTEGER NOT NULL,
        nPageno INTEGER NOT NULL,
        nLSesid TEXT,
        cTimezone TEXT NOT NULL,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        isFeedSynced BOOLEAN NOT NULL DEFAULT 0,
        cStatus TEXT NOT NULL,
        isTranscript BOOLEAN NOT NULL DEFAULT 0,
        nCaseid TEXT,
        isUsersSynced BOOLEAN NOT NULL DEFAULT 0,
        cProtocol TEXT NOT NULL,
        bRefresh BOOLEAN DEFAULT 0
      )
    `,
    sessiondetail: `CREATE TABLE IF NOT EXISTS RSessionDetail
  (
      nSDid TEXT PRIMARY KEY,
      nSesid TEXT,
      nUserid TEXT,
      cUsertype varchar(2),
      dDelDt timestamp,
      cDefHIssues TEXT,
      nLID TEXT,
      cDefIssues TEXT,
      nLIid TEXT,
      isSynced BOOLEAN NOT NULL DEFAULT 0,
      nRefSDid integer,
      UNIQUE (nSesid,nUserid) -- Add a unique constraint on the combination
  )
  `,
  servers: `
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        nUserid TEXT NOT NULL,
        cName TEXT NOT NULL,
        cUrl TEXT NOT NULL,
        nPort INTEGER NOT NULL
      )
    `,
  logsession: `
    CREATE TABLE IF NOT EXISTS logsession (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cSession TEXT NOT NULL
    )
  `,
  refreshtype: `
    CREATE TABLE IF NOT EXISTS refreshtype (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cType TEXT NOT NULL
    )
  `,
  assignment: `
      CREATE TABLE IF NOT EXISTS assignment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nSesid TEXT NOT NULL,
        cUsers TEXT NOT NULL
      )
    `,
  casedetail: `
      CREATE TABLE IF NOT EXISTS CaseDetail (
        nCaseid TEXT PRIMARY KEY,
        cCasename TEXT NOT NULL,
        cCaseno TEXT NOT NULL,
        cClaimant TEXT NOT NULL,
        cRespondent TEXT NOT NULL,
        cIndexheader TEXT NOT NULL,
        cDesc TEXT NOT NULL,
        cTClaimant TEXT NOT NULL,
        cTRespondent TEXT NOT NULL
      )`,
  feed: `
      CREATE TABLE IF NOT EXISTS feed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nSesid TEXT NOT NULL,
        line_index INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        line_number INTEGER NOT NULL,
        page_number INTEGER NOT NULL,
        formate TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT
      )`,
  deletesessions: `
      CREATE TABLE IF NOT EXISTS deletesessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nSesid TEXT NOT NULL,
        nLSesid INTEGER NOT NULL
      )
    `,
  issueCategory: `
      CREATE TABLE IF NOT EXISTS IssueCategory (
        nICid TEXT PRIMARY KEY,
        nRefICid INTEGER,
        nCaseid TEXT,
        cCategory VARCHAR(200),
        nUserid TEXT,
        dCreateDt TIMESTAMP,
        dUpdateDt TIMESTAMP,
        cICtype VARCHAR(1),
        nOICid INTEGER,
        isSynced BOOLEAN NOT NULL DEFAULT 0
      )
    `,
  rIssueMaster: `
      CREATE TABLE IF NOT EXISTS RIssueMaster (
        nIid TEXT PRIMARY KEY,
        cIName VARCHAR(500),
        cColor VARCHAR(6),
        nICid TEXT,
        dCreatedt TIMESTAMP,
        nUserid TEXT,
        dUpdatedt TIMESTAMP,
        nCaseid TEXT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefIid INTEGER
      )
    `,
  rIssueDetail: `
      CREATE TABLE IF NOT EXISTS RIssueDetail (
        nIDid TEXT PRIMARY KEY,
        cNote TEXT,
        cUNote TEXT,
        nSessionid INTEGER,
        nCaseid TEXT,
        cPageno VARCHAR(50),
        jCordinates JSON,
        jOCordinates JSON,
        nUserid TEXT,
        dCreatedt TIMESTAMP,
        dUpdatedt TIMESTAMP,
        cONote TEXT,
        nLID TEXT,
        jTCordinates JSON,
        cTPageno VARCHAR(50),
        bTrf BOOLEAN DEFAULT 0,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefIDid INTEGER
      )
    `,
    rIssueDetailLog: `
      CREATE TABLE IF NOT EXISTS RIssueDetailLog (
        nId INTEGER PRIMARY KEY AUTOINCREMENT,
        nIDid TEXT,
        cONote TEXT,
        jCordinates JSON,
        jDCordinates JSON,
        nRefresh INTEGER,
        dCreatedt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
  rIssueMapid: `
      CREATE TABLE IF NOT EXISTS RIssueMapid (
        nMapid TEXT PRIMARY KEY,
        nIDid TEXT,
        nIid TEXT,
        nRelid SMALLINT,
        nImpactid SMALLINT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefMapid INTEGER,
        serialno INTEGER
      )
    `,
  rHighlights: `
      CREATE TABLE IF NOT EXISTS RHighlights (
        nHid TEXT PRIMARY KEY,
        cNote TEXT,
        jCordinates JSON,
        nCaseid TEXT,
        nSessionId INTEGER,
        nUserid TEXT,
        dCreatedt TEXT,
        cPageno VARCHAR(10),
        cLineno VARCHAR(5),
        cOPageno VARCHAR(10),
        cOLineno VARCHAR(5),
        cTPageno VARCHAR(10),
        cTLineno VARCHAR(10),
        cTime VARCHAR(10),
        cTTime VARCHAR(30),
        nLID TEXT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefHid INTEGER,
        oP INTEGER,
        oL INTEGER,
        identity TEXT
      )
    `,
    rHighlightsLog: `
        CREATE TABLE IF NOT EXISTS RHighlightsLog (
          nHLogid INTEGER PRIMARY KEY AUTOINCREMENT,
          nHid TEXT,
          cPageno VARCHAR(10),
          cLineno VARCHAR(5),
          cTime VARCHAR(10),
          nRefresh INTEGER,
          dCreateDt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
  rHighlightMapid: `
      CREATE TABLE IF NOT EXISTS RHighlightMapid (
        nMapid TEXT PRIMARY KEY,
        nHid TEXT,
        nIid TEXT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefMapid INTEGER,
        serialno INTEGER
      )
    `,
  rtlogs: `
        CREATE TABLE IF NOT EXISTS RTLogs (
          nRTLid INTEGER PRIMARY KEY AUTOINCREMENT,
          nUserid TEXT,
          nSesid TEXT,
          cStatus VARCHAR(2),
          dCreateDt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          cSource VARCHAR(1),
          isSynced BOOLEAN NOT NULL DEFAULT 0,
          dLeaveDt TIMESTAMP,
          nRefRTLid INTEGER
        )
      `,
  codemaster: `
      CREATE TABLE IF NOT EXISTS Codemaster (
        nCodeid INTEGER,
        nCategoryid INTEGER,
        cCodename VARCHAR(100),
        nSerialno SMALLINT,
        nParentcodeid INTEGER,
        nUserid TEXT,
        jOther TEXT,
        jParents TEXT
      )
    `,
  caseusers: `
        CREATE TABLE IF NOT EXISTS caseusers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nCaseid TEXT,
          nUserid TEXT,
          UNIQUE (nCaseid, nUserid) -- Add a unique constraint on the combination
        )
      `,
  rIssueSummaryView: `
      CREATE VIEW IF NOT EXISTS RIssuesummary AS
      SELECT 
        rd.nIDid,
        rd.cNote,
        rd.nSessionid,
        rd.nCaseid,
        rd.cPageno,
        rd.jCordinates,
        rd.nUserid,
        rd.dCreatedt,
        rd.dUpdatedt,
        rd.cONote,
        COUNT(*) AS nICount,
        json_group_array(json_object('nIid', rm.nIid, 'nRelid', rm.nRelid, 'nImpactid', rm.nImpactid , 'serialno' , coalesce(rm.serialno,0) )) AS cIid,
        im.cColor,
        rd.jTCordinates,
        rd.cTPageno,
        rd.bTrf,
        rd.cUNote,
        rd.jOCordinates
      FROM RIssueDetail rd
      JOIN RIssueMapid rm ON rm.nIDid = rd.nIDid
      LEFT JOIN RIssueMaster im ON im.nIid = rd.nLID
      GROUP BY 
        rd.nIDid, 
        rd.cNote, 
        rd.nSessionid, 
        rd.nCaseid, 
        rd.cPageno, 
        rd.jCordinates, 
        rd.nUserid, 
        rd.dCreatedt, 
        rd.dUpdatedt, 
        rd.cONote, 
        im.cColor, 
        rd.jTCordinates, 
        rd.cTPageno,
        rd.cUNote,
        rd.jOCordinates;
    `,
  issueDetailCountView: `
      CREATE VIEW IF NOT EXISTS issue_detail_count AS
      SELECT 
        rm.nIid,
        group_concat(rm.nIDid, ',') AS string_agg,
        count(DISTINCT rm.nIDid) AS nTotalID,
        rd.nCaseid,
        rd.nUserid,
        rd.nSessionid
      FROM RIssueDetail rd
      JOIN RIssueMapid rm ON rm.nIDid = rd.nIDid
      GROUP BY rm.nIid, rd.nCaseid, rd.nUserid, rd.nSessionid;
    `, sync_log: `
      CREATE TABLE IF NOT EXISTS sync_log (
        table_name text, row_id int, operation text, last_modified timestamp default current_timestamp
      )`,
  delete_log: `
      CREATE TABLE IF NOT EXISTS delete_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          deleted_id INTEGER NOT NULL,
          isSynced BOOLEAN NOT NULL DEFAULT 0,
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      `,
  log_issuecategory_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_issuecategory_deletion
      AFTER DELETE ON IssueCategory
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'IssueCategory', OLD.nRefICid
        WHERE OLD.nRefICid > 0;
      END;
    `,
  log_rissuemaster_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rissuemaster_deletion
      AFTER DELETE ON RIssueMaster
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RIssueMaster', OLD.nRefIid
        WHERE OLD.nRefIid > 0;
      END;
    `,
  log_rissuedetail_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rissuedetail_deletion
      AFTER DELETE ON RIssueDetail
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RIssueDetail', OLD.nRefIDid
        WHERE OLD.nRefIDid > 0;
      END;
    `,
  log_rissuemapid_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rissuemapid_deletion
      AFTER DELETE ON RIssueMapid
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RIssueMapid', OLD.nRefMapid
        WHERE OLD.nRefMapid > 0;
      END;
    `,
  log_rhighlights_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rhighlights_deletion
      AFTER DELETE ON RHighlights
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RHighlights', OLD.nRefHid
        WHERE OLD.nRefHid > 0;
      END;
    `,
  log_rhighlightmapid_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rhighlightmapid_deletion
      AFTER DELETE ON RHighlightMapid
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RHighlightMapid', OLD.nRefMapid
        WHERE OLD.nRefMapid > 0;
      END;
    `
};
