CREATE OR REPLACE FUNCTION public.et_admin_case_teamsetup(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid        uuid;
    nCaseid          uuid;
    jUsers           jsonb;

    nRole_witness uuid;
    nRole_default uuid;
	
BEGIN
    nMasterid := (parameter ->> 'nMasterid')::uuid;
    nCaseid   := (parameter ->> 'nCaseid')::uuid;
    jUsers    := (parameter ->> 'jUsers')::jsonb;

	
nRole_witness := (select "nRoleid" from "RoleMaster" where "nSrno" = 3); -- 4

nRole_default := (select "nRoleid" from "RoleMaster" where "nSrno" = 2); -- 3
	
/*

select * from public.et_admin_case_teamsetup ('{"nCaseid":"7e377fca-5227-487f-a292-0b6187c7ef09","jUsers":"[{\"u\":\"b1812980-6984-49a1-8495-b65ba39a38d5\",\"t\":\"8f54d570-2612-4a9b-bc9b-d56fcf63ebce\"},{\"u\":\"556f6dc5-2ade-4892-b419-a758d6eb7d83\",\"t\":\"8f54d570-2612-4a9b-bc9b-d56fcf63ebce\"},{\"u\":\"9f8e3d90-f3e9-41a5-989f-35add81276ec\",\"t\":\"18d3c882-7a01-4e4f-b64a-a292881600fd\"},{\"u\":\"fb7e70b6-ce0a-4177-932b-f8216cbbfde4\",\"t\":\"1812ca17-4495-4665-9949-0432b1ce2845\"}]","nMasterid":"fb7e70b6-ce0a-4177-932b-f8216cbbfde4"}','r1');fetch all in "r1";

select CONCAT('[{"u":','"', "nUserid"::text, '"}]')::jsonb ,*from "TeamRelation"

select * From "RoleMaster"
*/

    -- remove relations not in the incoming JSON
    -- DELETE FROM "TeamRelation"
    -- WHERE "nCaseid" = nCaseid
    --   AND NOT (jUsers @> CONCAT('[{"u":"', "nUserid", '"}]')::jsonb);

	WITH deleted AS (
	  DELETE FROM "TeamRelation" tr
	  WHERE tr."nCaseid" = nCaseid
		 AND NOT (jUsers @> CONCAT('[{"u":"', "nUserid", '"}]')::jsonb)
	  RETURNING tr."nCaseid", tr."nUserid"
	)
	DELETE FROM "UserPermission" up
	USING deleted d
	WHERE up."nCaseid" = d."nCaseid"
	  AND up."nUserid" = d."nUserid";

    -- update existing relations
    UPDATE "TeamRelation" tr
    SET
      "nTeamid" = t."t",
      "nRoleid" = t."r"
    FROM (
      SELECT
        tm."u"::uuid,
        tm."t"::uuid,
        CASE
          WHEN team."cFlag" = team1."cFlag" THEN tr."nRoleid"
          WHEN team."cFlag" = 'W'      THEN nRole_witness
          ELSE nRole_default
        END AS r
      FROM jsonb_to_recordset(jUsers) AS tm(u uuid,t uuid)
      LEFT JOIN "TeamMaster"    team  ON team."nTeamid" = tm.t
      LEFT JOIN "TeamRelation"  tr    ON tr."nCaseid" = nCaseid AND tr."nUserid" = tm.u
      LEFT JOIN "TeamMaster"    team1 ON team1."nTeamid" = tr."nTeamid"
    ) AS t
    WHERE tr."nCaseid" = nCaseid
      AND tr."nUserid" = t."u";

			    -- grant bundle-view permission to any new users
			    -- INSERT INTO "UserPermission"("nCaseid","nPMid","nUserid")
			    -- SELECT
			    --   nCaseid,
			    --   15,
			    --   u
			    -- FROM jsonb_to_recordset(jUsers) AS tm(u uuid,t uuid)
			    -- WHERE NOT EXISTS (
			    --   SELECT 1 FROM "TeamRelation" tr
			    --   WHERE tr."nCaseid" = nCaseid
			    --     AND tr."nUserid" = tm.u
			    -- );

				insert into "UserPermission" ("nPMid","nCaseid","nUserid")
				select "nPMid",nCaseid,tm.u from "PermissionDefault" r ,jsonb_to_recordset(jUsers) AS tm(u uuid,t uuid)
				left join "TeamMaster" team on team."nTeamid" = tm.t
				where "bStatus" = false and NOT EXISTS (
			      SELECT 1 FROM "TeamRelation" tr
			      WHERE tr."nCaseid" = nCaseid
			        AND tr."nUserid" = tm.u
			    ) and "nRoleid" =  CASE WHEN team."cFlag" = 'W' THEN nRole_witness ELSE nRole_default END;
	

-- select * from "RoleMaster"
    -- insert any remaining new relations
    INSERT INTO "TeamRelation"("nUserid","nTeamid","nCaseid","nRoleid")
    SELECT
      tm."u",
      tm."t",
      nCaseid,
      CASE WHEN team."cFlag" = 'W' THEN nRole_witness ELSE nRole_default END
    FROM jsonb_to_recordset(jUsers) AS tm(u uuid,t uuid)
    JOIN "TeamMaster" team ON team."nTeamid" = tm.t
    WHERE NOT EXISTS (
      SELECT 1 FROM "TeamRelation" tr
      WHERE tr."nCaseid" = nCaseid
        AND tr."nUserid" = tm.u
    );

    OPEN ref FOR
        SELECT 1 AS msg, "nCaseid", "cCasename", "cCaseno"
        FROM "CaseMaster"
        WHERE "nCaseid" = nCaseid;
    RETURN ref;
END;
$function$
