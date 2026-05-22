CREATE OR REPLACE FUNCTION public.et_admin_insertupdate_case(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid       uuid;
    nCaseid       uuid;
    cCasename     text;
    cDesc         text;
    permission    text;
    cCaseno       text;
    cClaimant     text;
    cRespondent   text;
    cTClaimant    text;
    cTRespondent  text;
    cIndexheader  text;
    nICid         uuid;
BEGIN
    nUserid      := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid      := NULLIF(parameter ->> 'nCaseid','')::uuid;
    cCasename    :=  parameter ->> 'cCasename';
    cDesc        :=  parameter ->> 'cDesc';
    permission   :=  parameter ->> 'permission';
    cCaseno      :=  parameter ->> 'cCaseno';
    cClaimant    :=  parameter ->> 'cClaimant';
    cRespondent  :=  parameter ->> 'cRespondent';
    cTClaimant   :=  parameter ->> 'cTClaimant';
    cTRespondent :=  parameter ->> 'cTRespondent';
    cIndexheader :=  parameter ->> 'cIndexheader';

    /*
     sample calls, seq resets, RolePermission/CaseMaster/TeamMaster selects...
--select * from public.et_admin_insertupdate_case ('{"nCaseid":"7e377fca-5227-487f-a292-0b6187c7ef09","cCasename":"Testing","cCaseno":"270225","cDesc":"Arbitration on 27 March to 3 April 2025-1","cIndexheader":"BEFORE THE INTERNATIONAL COURT OF ARBITRATION\nINTERNATIONAL CHAMBER OF COMMERCE","cClaimant":"Primetals Technologies India Private Limited","cRespondent":"(1) Steel Authority of India Limited;\n(2) Pomini Long Rolling Mills SRL (Pomini LRM); and \n(3) Shriram EPC Limited","cTClaimant":"Primetals Technologies India Private Limited","cTRespondent":"(1) Steel Authority of India Limited;\n(2) Pomini Long Rolling Mills SRL (Pomini LRM); and \n(3) Shriram EPC Limited","permission":"E","nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}','r1');fetch all in "r1";
 select * from public.et_admin_insertupdate_case ('{"nCaseid":"7e377fca-5227-487f-a292-0b6187c7ef09","cCasename":"Testing","cCaseno":"270225","cDesc":"Arbitration on 27 March to 3 April 2025-1","cIndexheader":"BEFORE THE INTERNATIONAL COURT OF ARBITRATION\nINTERNATIONAL CHAMBER OF COMMERCE","cClaimant":"Primetals Technologies India Private Limited","cRespondent":"(1) Steel Authority of India Limited;\n(2) Pomini Long Rolling Mills SRL (Pomini LRM); and \n(3) Shriram EPC Limited","cTClaimant":"Primetals Technologies India Private Limited","cTRespondent":"(1) Steel Authority of India Limited;\n(2) Pomini Long Rolling Mills SRL (Pomini LRM); and \n(3) Shriram EPC Limited","permission":"E","nMasterid":"fb7e70b6-ce0a-4177-932b-f8216cbbfde4"}','r1');fetch all in "r1";

select * from "PermissionModule"
	 select * from "RoleMaster" order by "ZnRoleid"
	 select * from "LogCaseMaster" 
select * From "LogCategory"
	 
    */
    IF permission = 'N' THEN
        IF NOT EXISTS (
            SELECT *
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        ELSE
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
            ) THEN
                INSERT INTO "CaseMaster"(
                    "cCasename","dCreateDt","nCreateId","cDesc","cCaseno",
                    "cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader",
                    "cTranscriptMode"
                )
                VALUES(
                    cCasename, now(), nUserid, cDesc, cCaseno,
                    cClaimant, cRespondent, cTClaimant, cTRespondent, cIndexheader,
                    'HTML'
                )
                RETURNING "nCaseid" INTO nCaseid;

                INSERT INTO "TeamMaster"(
                    "cTeamname","dCreateDt","nCreateId","nCaseid","cFlag","cClr"
                )
                SELECT
                    "cCodename", now(), nUserid, nCaseid,
                    COALESCE(("jOther"->>'flag')::text, ''),
                    ("jOther"->>'cClr')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 11
              ORDER BY "nSerialno";

                INSERT INTO "SectionMaster"(
                    "cFolder","cIcon","nCaseid","nUserid","cFoldertype","cMsg"
                )
                SELECT
                    "cCodename", "jOther"->>'icon', nCaseid, NULL,
                    "jOther"->>'cFlag', ("jOther"->>'cMsg')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 13
                   AND ("jOther"->>'cFlag')::text IN ('MB','TS')
              ORDER BY "nSerialno";

                INSERT INTO "IssueCategory"(
                    "nCaseid","cCategory","nUserid","dCreateDt","cICtype"
                )
                VALUES(
                    nCaseid, 'Unassigned',
                    -- no real user, so zero-UUID placeholder
                    null,
                    now(), 'U'
                )
                RETURNING "nICid" INTO nICid;

                INSERT INTO "RIssueMaster"(
                    "cIName","cColor","nICid","nUserid","dCreatedt","nCaseid"
                )
                VALUES(
                    'Unassigned', 'FFA94D',
                    nICid,
                    null,
                    now(), nCaseid
                );
-- select * from "RoleMaster"
				-- insert into "RolePermission"("nCaseid","nPMid","nRoleid","dModifydt")
				-- select nCaseid,15,"nRoleid",now() from "RoleMaster";

				
				insert into "RolePermission" ("nPMid","cType","nCaseid","nRoleid","dModifydt")
				select "nPMid",'R',nCaseid,r."nRoleid",now() from "RoleMaster" r 
				join "PermissionDefault" pd on pd."nRoleid" = r."nRoleid" where "bStatus" = false ;
	

                OPEN ref FOR
                    SELECT 1 as msg, 'Case Created' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;

                INSERT INTO public."LogCaseMaster"(
                    "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
                )
                SELECT
                    7, "nCaseid", "cCasename", "cCaseno", nUserid
                  FROM "CaseMaster"
                 WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;
        END IF;
    END IF;

    IF permission = 'E' THEN
        IF EXISTS (
            SELECT 1
              FROM "TeamRelation" t
             WHERE t."nCaseid" = nCaseid
               AND t."nUserid" = nUserid
               AND t."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid
            UNION
            SELECT 1
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE (
                       upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
                   )
                   AND "nCaseid" <> nCaseid
            ) THEN
                UPDATE "CaseMaster"
                   SET "cCasename"  = cCasename,
                       "cCaseno"    = cCaseno,
                       "cDesc"      = cDesc,
                       "cClaimant"  = cClaimant,
                       "cRespondent"= cRespondent,
                       "cTClaimant" = cTClaimant,
                       "cTRespondent"= cTRespondent,
                       "cIndexheader"= cIndexheader,
                       "dUpdateDt"  = now(),
                       "nUpdateId"  = nUserid
                 WHERE "nCaseid"   = nCaseid;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case updated' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;

            INSERT INTO public."LogCaseMaster"(
                "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
            )
            SELECT
                8, "nCaseid", "cCasename", "cCaseno", nUserid
              FROM "CaseMaster"
             WHERE "nCaseid" = nCaseid;
        ELSE
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        END IF;
    END IF;

    RETURN ref;
END;
$function$
