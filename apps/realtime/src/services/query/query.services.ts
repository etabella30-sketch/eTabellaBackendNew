// src/services/query/query.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService {

  getIssueCategoryQuery(): { query: string } {
    const query = `
      SELECT * FROM (
        SELECT c.nICid, c.cCategory FROM IssueCategory c
        WHERE c.nCaseid = ? AND c.cICtype = 'U'
        UNION ALL
        SELECT ic.nICid, ic.cCategory FROM IssueCategory ic
        WHERE ic.nCaseid = ? AND ic.nUserid = ? AND COALESCE(ic.cICtype, '') != 'U'
      ) dt
      ORDER BY dt.cCategory
    `;
    const params = [];
    return { query };
  }

  getIssueListQuery(): { query: string } {
    const query = `
      SELECT im.nIid, im.cIName, im.cColor, ic.nICid, ic.cCategory, 
             COALESCE(id.nTotalID, 0) AS nTotalID, 
             0 AS nRelid, 0 AS nImpactid, im.nUserid, 
             COUNT(rh.nIid) AS nTotalHID
      FROM RIssueMaster im 
      JOIN IssueCategory ic ON ic.nICid = im.nICid
      LEFT JOIN issue_detail_count id ON id.nIid = im.nIid 
        AND im.nCaseid = id.nCaseid 
        AND im.nUserid = id.nUserid
        AND id.nSessionid = ?
      LEFT JOIN (
        SELECT m.nIid
        FROM RHighlights rh
        JOIN RHighlightMapid m ON m.nHid = rh.nHid
        WHERE rh.nSessionId = ? AND rh.nUserid = ?
      ) rh ON rh.nIid = im.nIid
      WHERE coalesce(ic.nCaseid,'') = coalesce(?,'')
        AND (im.nUserid = ? OR (im.nUserid = 0 AND coalesce(im.nCaseid,'') = coalesce(?,'') ))
      GROUP BY im.nIid, im.cIName, im.cColor, ic.nICid, ic.cCategory, id.nTotalID, im.nUserid
      ORDER BY im.cIName;
    `;

    return { query };
  }
// ic.nCaseid = ?
  getPageDataQuery(cTranscript: string): { query: string } {
    let pageColumn = cTranscript === 'N' ? '"cPageno"' : '"cTPageno"';
    let lineColumn = cTranscript === 'N' ? '"cLineno"' : '"cTLineno"';

    const query = `
    SELECT json_group_array(
      json_object(
        'nHid', nHid,
        'nGroupid', nGroupid,
        '${lineColumn}', ${lineColumn},
        'issueids', issueids
      )
    ) AS pageData
    FROM (
      SELECT dt.nHid, dt.unique_no AS nGroupid, dt.${lineColumn}, dt.i AS issueids 
      FROM (
        SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, ${pageColumn}, grp) AS unique_no 
        FROM (
          SELECT CAST(${lineColumn} AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY CAST(${pageColumn} AS INTEGER), json_group_array(m.nIid ORDER BY m.nIid) ORDER BY CAST(${lineColumn} AS INTEGER)) AS grp,  
            ${pageColumn}, ${lineColumn}, m.nHid, group_concat(CAST(m.nIid AS TEXT), ',') AS i
          FROM RHighlights h 
          JOIN RHighlightMapid m ON h.nHid = m.nHid
          WHERE h.nSessionId = ? 
            AND h.nUserid = ? 
            AND h.${pageColumn} = ?
          GROUP BY ${pageColumn}, ${lineColumn}, m.nHid
          ORDER BY m.nHid
        ) dt 
        ORDER BY ${pageColumn}, ${lineColumn}, nHid, i
      ) dt  
      ORDER BY unique_no
    );
  `;



    //  console.log('query = ',query)
    return { query };
  }


  getHighlightPageDataQueryForLiveFeed() {
    return `  SELECT rh.nHid, 
             cPageno,
            cLineno,
             cTime, cColor, rg.nGroupid, rg.issueids
      FROM RHighlights rh
      LEFT JOIN (
        WITH tbl AS (
          SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no
          FROM (
            SELECT CAST(cLineno AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY CAST(cPageno AS INTEGER), json_group_array(m.nIid ORDER BY m.nIid) 
            ORDER BY CAST(cLineno AS INTEGER)) AS grp, 
            CAST(cPageno AS INTEGER) AS cPageno, CAST(cLineno AS INTEGER) AS cLineno, 
            m.nHid, GROUP_CONCAT(m.nIid, ',') AS i
            FROM RHighlights h
            JOIN (
            select rhm."nIid",rhm."nHid" from RHighlightMapid rhm order by rhm."serialno") m ON h.nHid = m.nHid
            WHERE h.nSessionId = ? AND h.nUserid = ?  AND h.cPageno = ?
            GROUP BY CAST(cPageno AS INTEGER), CAST(cLineno AS INTEGER), m.nHid
            ORDER BY m.nHid
          ) dt
          ORDER BY cPageno, cLineno, nHid, i
        )
        SELECT nHid, unique_no AS nGroupid, i AS issueids
        FROM tbl
        ORDER BY unique_no
      ) rg ON rg.nHid = rh.nHid
      LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
      WHERE  rh.nUserid = ? AND rh.nSessionId = ?`
  }

  getIssueDetailQuery(): { query: string } {
    const query = `SELECT rd.nIDid, rd.cNote, rd.cPageno, rd.cONote, rl.cCodename AS cRelevance,
             imp.cCodename AS cImpact, rm.nRelid, rm.nImpactid
      FROM RIssueDetail rd
      JOIN RIssueMapid rm ON rm.nIDid = rd.nIDid
      LEFT JOIN Codemaster rl ON rl.nCodeid = rm.nRelid
      LEFT JOIN Codemaster imp ON imp.nCodeid = rm.nImpactid
      WHERE       
      coalesce(rd.nCaseid,'') = coalesce(?,'')
      AND rd.nSessionid = ? AND rd.nUserid = ? AND rm.nIid = ?;`

    return { query };
  }

  getHightlightGroupQuery(): { query: string } {
    const query = ` WITH tbl AS (
        SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no 
        FROM (
          SELECT cLineno - ROW_NUMBER() OVER (PARTITION BY cPageno ORDER BY cLineno) AS grp, 
                 cPageno, cLineno, m.nHid, GROUP_CONCAT(m.nIid) AS i
          FROM RHighlights h 
          JOIN RHighlightMapid m ON h.nHid = m.nHid
          WHERE h.nSessionId = ? AND h.nUserid = ? AND m.nIid = ?
          GROUP BY cPageno, cLineno, m.nHid
          ORDER BY m.nHid
        ) dt 
        ORDER BY cPageno, cLineno, nHid, i
      )
      SELECT t.unique_no AS nGroupid, t.i AS issueids, json_group_array(json_object('nHid', rh.nHid, 'cNote', rh.cNote, 'cPageno', rh.cPageno, 'cLineno', rh.cLineno)) AS highlights
      FROM tbl t
      JOIN (
        SELECT nHid, cNote, cPageno, cLineno 
        FROM RHighlights
      ) rh ON rh.nHid = t.nHid
      GROUP BY t.unique_no, t.i
      ORDER BY t.unique_no;`

    return { query };
  }


  getIssueAnnotationListQuery(): { query: string } {
    const query = ` SELECT 
        nIDid,
        cPageno AS pageIndex,
        jCordinates AS cordinates,
        cColor AS color,
        nICount
      FROM RIssuesummary
      WHERE
      coalesce(nCaseid,'') = coalesce(?,'')
      AND nSessionid = ? AND nUserid = ?`;

    return { query };
  }

  getIssueDetailByIdQuery(): { query: string } {
    const query = ` SELECT 
      *
      FROM RIssuesummary
      WHERE nIDid = ?`;
    return { query };
  }

  getCodeMasterQuery(): { query: string } {
    const query = `SELECT 
        nCodeid AS nValue,
        cCodename AS cKey,
        jOther,
        nSerialno
      FROM Codemaster
      WHERE nCategoryid = ?
      ORDER BY nSerialno, cCodename`

    return { query };
  }

  getHighlightListQuery(): { query: string } {
    const query = `
      SELECT nHid, cPageno, cLineno 
      FROM RHighlights
      WHERE 
        coalesce(nCaseid,'') = coalesce(?,'')
      AND nUserid = ? AND nSessionId = ?`

    return { query };
  }
  geFilterLastSelecedQuery(): { query: string } {
    // const query =`
    //     SELECT t.nIid
    //     FROM (
    //       SELECT
    //         json_extract(value, '$.nIid') AS nIid,
    //         json_extract(value, '$.nRelid') AS nRelid,
    //         json_extract(value, '$.nImpactid') AS nImpactid,
    //         json_extract(value, '$.dt') AS dt
    //       FROM json_each(?)
    //     ) t
    //     LEFT JOIN Codemaster r ON r.nCodeid = t.nRelid
    //     LEFT JOIN Codemaster i ON i.nCodeid = t.nImpactid
    //     ORDER BY COALESCE(r.nSerialno, 999), COALESCE(i.nSerialno, 999), datetime(t.dt) DESC
    //     LIMIT 1`

    const query = `SELECT 
    t.nIid,
    ROW_NUMBER() OVER (ORDER BY COALESCE(r.nSerialno, 999) ASC, COALESCE(i.nSerialno, 999) ASC, datetime(t.serialno) ASC) AS serialno
FROM (
    SELECT
        json_extract(value, '$.nIid') AS nIid,
        json_extract(value, '$.nRelid') AS nRelid,
        json_extract(value, '$.nImpactid') AS nImpactid,
        json_extract(value, '$.serialno') AS serialno,
        json_extract(value, '$.dt') AS dt
    FROM json_each(?)
) t
LEFT JOIN Codemaster r ON r.nCodeid = t.nRelid
LEFT JOIN Codemaster i ON i.nCodeid = t.nImpactid
ORDER BY COALESCE(r.nSerialno, 999) ASC, COALESCE(i.nSerialno, 999) ASC, datetime(t.serialno) ASC;
`;
    return { query };

  }
  getAnnotHighlightExport_RID_Query(): { query: string } {
    const query = `
      WITH tbl AS (
        SELECT id.nIDid,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN id.cPageno ELSE id.cTPageno END AS pageIndex,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN id.jCordinates ELSE id.jTCordinates END AS cordinates,
               id.cColor as color,
               id.nICount,
               id.cONote
        FROM RIssuesummary id
        WHERE 
        coalesce(id.nCaseid,'') = coalesce(?,'')
          AND id.nSessionid = ?
          AND id.nUserid = ?
      )
      SELECT t.*
      FROM tbl t
      LEFT JOIN RIssueMapid rs ON rs.nIDid = t.nIDid
      WHERE (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = rs.nIid))
        AND (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = t.pageIndex))
      GROUP BY t.nIDid, t.pageIndex, t.cordinates, t.color, t.nICount, t.cONote;
   `

    return { query };
  }

  getAnnotHighlightExport_RH_Query(): { query: string } {
    const query = `
      WITH tbl AS (
        SELECT rh.nHid,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN rh.cPageno ELSE rh.cTPageno END AS cPageno,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN rh.cLineno ELSE rh.cTLineno END AS cLineno,
               rh.cTime,
               cColor,
               rg.nGroupid,
               rg.issueids
        FROM RHighlights rh
        LEFT JOIN (
          WITH tbl AS (
            SELECT *,
                   grp,
                   DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no
            FROM (
              SELECT cLineno - ROW_NUMBER() OVER (PARTITION BY cPageno ORDER BY cLineno) AS grp,
                     cPageno,
                     cLineno,
                     m.nHid,
                     group_concat(m.nIid) AS i
              FROM RHighlights h
              JOIN RHighlightMapid m ON h.nHid = m.nHid
              WHERE h.nSessionId = ?
                AND h.nUserid = ?
              GROUP BY cPageno, cLineno, m.nHid
            ) dt
            ORDER BY cPageno, cLineno, nHid, i
          )
          SELECT nHid, unique_no AS nGroupid, i AS issueids
          FROM tbl
          ORDER BY unique_no
        ) rg ON rg.nHid = rh.nHid
        LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
        WHERE 
          coalesce(rh.nCaseid,'') = coalesce(?,'')
          AND rh.nUserid = ?
          AND rh.nSessionId = ?
      )
      SELECT t.*
      FROM tbl t
      LEFT JOIN RHighlightMapid rm ON rm.nHid = t.nHid
      WHERE (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = rm.nIid))
        AND (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = t.cPageno))
      GROUP BY t.nHid, t.cPageno, t.cLineno, t.cTime, t.cColor, t.nGroupid, t.issueids;
    `;

    return { query };
  }


  getAnnotOfPagesIssueSummaryQuery(): { query: string } {
    const query = `SELECT nIDid, 
             CASE WHEN COALESCE(?, 'N') = 'N' THEN cPageno ELSE cTPageno END AS pageIndex,
             CASE WHEN COALESCE(?, 'N') = 'N' THEN jCordinates ELSE jTCordinates END AS cordinates,
             cColor AS color, nICount, bTrf
      FROM RIssuesummary
      WHERE coalesce(nCaseid,'') = coalesce(?,'') AND nSessionid = ? AND nUserid = ?`

    return { query };
  }
  getAnnotOfPagesHighlightsQuery(): { query: string } {
    const query = `
      SELECT rh.nHid, 
             CASE WHEN COALESCE(?, 'N') = 'N' THEN cPageno ELSE cTPageno END AS cPageno,
             CASE WHEN COALESCE(?, 'N') = 'N' THEN cLineno ELSE cTLineno END AS cLineno,
             cTime, cColor ,rh.identity,rh.oL , rg.nGroupid, rg.issueids
      FROM RHighlights rh
      LEFT JOIN (
        WITH tbl AS (
          SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no
          FROM (
            SELECT CAST(cLineno AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY CAST(cPageno AS INTEGER), json_group_array(m.nIid ORDER BY m.nIid) 
            ORDER BY CAST(cLineno AS INTEGER)) AS grp, 
            CAST(cPageno AS INTEGER) AS cPageno, CAST(cLineno AS INTEGER) AS cLineno, 
            m.nHid, GROUP_CONCAT(m.nIid, ',') AS i
            FROM RHighlights h
            JOIN (
            select rhm."nIid",rhm."nHid" from RHighlightMapid rhm order by rhm."serialno") m ON h.nHid = m.nHid
            WHERE h.nSessionId = ? AND h.nUserid = ?
            GROUP BY CAST(cPageno AS INTEGER), CAST(cLineno AS INTEGER), m.nHid
            ORDER BY m.nHid
          ) dt
          ORDER BY cPageno, cLineno, nHid, i
        )
        SELECT nHid, unique_no AS nGroupid, i AS issueids
        FROM tbl
        ORDER BY unique_no
      ) rg ON rg.nHid = rh.nHid
      LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
      WHERE coalesce(rh.nCaseid,'') = coalesce(?,'') AND rh.nUserid = ? AND rh.nSessionId = ?`

    return { query };
  }



  getAnnotIssueSummaryQuery(): any {
    const query = `
      WITH tbl AS (
        SELECT 
          id.nIDid,
          CASE 
            WHEN COALESCE(?, 'N') = 'N' THEN id.cPageno 
            ELSE id.cTPageno 
          END AS pageIndex,
          id.cColor,
          id.nICount,
          id.cONote,
          id.cNote
        FROM RIssuesummary id
        WHERE 
        coalesce(id.nCaseid,'') = coalesce(?,'')
          AND id.nSessionid = ?
          AND id.nUserid = ?
      ),
      dtl AS (
        SELECT 
          r.nIDid,
          isu.cIName,
          isu.cColor,
          rel.cCodename AS cRel,
          imp.cCodename AS cImp,
          ri.nRelid,
          ri.nImpactid
        FROM tbl r 
        JOIN RIssueMapid ri ON ri.nIDid = r.nIDid
        JOIN RIssueMaster isu ON isu.nIid = ri.nIid
        LEFT JOIN Codemaster rel ON rel.nCodeid = ri.nRelid
        LEFT JOIN Codemaster imp ON imp.nCodeid = ri.nImpactid
      )
      SELECT 
        r.nIDid,
        r.pageIndex,
        r.cColor,
        r.cONote,
        r.cNote,
        json_group_array(
          json_object(
            'nIDid', t.nIDid,
            'cIName', t.cIName,
            'cColor', t.cColor,
            'cRel', t.cRel,
            'cImp', t.cImp,
            'nRelid', t.nRelid,
            'nImpactid', t.nImpactid
          )
        ) AS issues
      FROM tbl r
      JOIN dtl t ON t.nIDid = r.nIDid
      GROUP BY 
        r.nIDid,
        r.pageIndex,
        r.cColor,
        r.cONote,
        r.cNote;
    `;
    return query;
  }

  getHighlightGroupQuery(): string {
    const query = `
     WITH tbl AS (
    SELECT 
        rh.nHid,
        CASE 
            WHEN COALESCE(?, 'N') = 'N' THEN rh.cPageno 
            ELSE rh.cTPageno 
        END AS cPageno,
        CASE 
            WHEN COALESCE(?, 'N') = 'N' THEN rh.cLineno 
            ELSE rh.cTLineno 
        END AS cLineno,
        rh.cTime,
        im.cColor,
        rg.nGroupid,
        rg.issueids,
        rh.cNote
    FROM RHighlights rh 
    LEFT JOIN (
        WITH tbl_inner AS (
            SELECT 
                *,
                grp,
                DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no 
            FROM (
                SELECT  
                    CAST(h_inner.cLineno AS INTEGER) - ROW_NUMBER() OVER (
                        PARTITION BY CAST(h_inner.cPageno AS INTEGER), group_concat(m.nIid, ',') 
                        ORDER BY CAST(h_inner.cLineno AS INTEGER)
                    ) AS grp,  
                    h_inner.cPageno, 
                    h_inner.cLineno,
                    m.nHid,
                    group_concat(m.nIid, ',') AS i
                FROM RHighlights h_inner 
                JOIN RHighlightMapid m ON h_inner.nHid = m.nHid
                WHERE  
                    h_inner.nSessionId = ? 
                    AND h_inner.nUserid = ? 
                GROUP BY h_inner.cPageno, h_inner.cLineno, m.nHid
                ORDER BY m.nHid
            ) dt 
            ORDER BY cPageno, cLineno, nHid, i
        ) 
        SELECT 
            tbl_inner.nHid, 
            tbl_inner.unique_no AS nGroupid, 
            tbl_inner.i AS issueids 
        FROM tbl_inner 
        ORDER BY unique_no
    ) rg ON rg.nHid = rh.nHid
    LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
    WHERE 
        rh.nUserid = ? 
        AND rh.nSessionId = ? 
),
dtl AS (
    SELECT 
        t.nHid, 
        r.cIName, 
        r.cColor
    FROM tbl t 
    JOIN RHighlightMapid rm ON rm.nHid = t.nHid
    JOIN RIssueMaster r ON r.nIid = rm.nIid
)
SELECT 
    t.*, 
    json_group_array(
        json_object(
            'nHid', d.nHid,
            'cIName', d.cIName,
            'cColor', d.cColor
        )
    ) AS issues
FROM tbl t
LEFT JOIN dtl d ON d.nHid = t.nHid 
GROUP BY  
    t.nHid,
    t.cPageno,
    t.cLineno,
    t.cTime,
    t.cColor,
    t.nGroupid,
    t.issueids,
    t.cNote;
    `;
    return query;
  }


  //   CASE strftime('%w', COALESCE(r.dStartDt, 'now'))
  //   WHEN '0' THEN 'Sunday'
  //   WHEN '1' THEN 'Monday'
  //   WHEN '2' THEN 'Tuesday'
  //   WHEN '3' THEN 'Wednesday'
  //   WHEN '4' THEN 'Thursday'
  //   WHEN '5' THEN 'Friday'
  //   WHEN '6' THEN 'Saturday'
  // END AS dDay,
  // strftime('%d %b %Y', COALESCE(r.dStartDt, 'now')) AS dSessionDt,

  getCaseDetail(): string {
    const query = `
      SELECT 
          COALESCE(r.id, 1) AS nSesid,
          COALESCE(r.cName, 'Demo session') AS cName,
          r.dStartDt,
          r.cStatus,
          r.cProtocol,
          c.*
      FROM CaseDetail c
      LEFT JOIN sessions r  
          ON c.nCaseid = r.nCaseid 
          AND r.id = ?
      WHERE coalesce(c.nCaseid,'') = coalesce(?,'')
      ;
   `
    return query;
  }

  /*
   getIssueDetailQuery(): { query: string } {
     const query =``

     return { query };
   }
     */


  getIssueVersion(): { query: string } {
    const query = ` SELECT * FROM RIssueDetailLog WHERE nIDid = ?`;
    return { query };
  }

  // Add more methods for other queries like updating, deleting, etc.
}
