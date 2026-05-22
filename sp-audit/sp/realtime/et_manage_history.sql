CREATE OR REPLACE FUNCTION realtime.et_manage_history(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nMHid uuid;
    nSesid uuid;
    nUserid uuid;
    nFSid uuid;
    nDocid uuid;
    nHid uuid;
    cPermission text;
	cType text;
	nBundledetailid uuid;
    cTimeFrame text;
    vInterval interval;

BEGIN
    
    nSesid  := NULLIF(parameter->>'nSesid','')::uuid;
    nUserid := NULLIF(parameter->>'nUserid','')::uuid;
    nFSid   := NULLIF(parameter->>'nFSid','')::uuid;
    nDocid  := NULLIF(parameter->>'nDocid','')::uuid;
    nHid    := NULLIF(parameter->>'nHid','')::uuid;
    cPermission := parameter->>'cPermission';
	cType := parameter->>'cType';
	nBundledetailid  := NULLIF(parameter->>'nBundledetailid','')::uuid;
    cTimeFrame := parameter->>'cTimeFrame';

-- select * FROM realtime."MarkNavHistory"
    -- Insert New History
    IF(cPermission = 'N') THEN
        -- INSERT INTO realtime."MarkNavHistory"("nSesid","nUserid","nFSid","nDocid","nHid", "cType")
        -- VALUES (nSesid,nUserid,nFSid,nDocid,nHid, cType);

if not exists (
	select t.* from (
	select *
	from realtime."MarkNavHistory" 
	where "nUserid"  = nUserid and  ("nSesid" = nSesid or "nBundledetailid" = nBundledetailid)  order by "dCreateDt" desc limit 1
	)t where  (t."nFSid" IS NOT DISTINCT FROM nFSid  and t."nDocid" IS NOT DISTINCT FROM nDocid and t."nHid"  IS NOT DISTINCT FROM nHid) and t."cType" = cType
)then 

 				INSERT INTO realtime."MarkNavHistory"("nSesid","nUserid","nFSid","nDocid","nHid","cType","nBundledetailid", "dCreateDt")
                SELECT nSesid, nUserid, nFSid, nDocid, nHid, cType,nBundledetailid, now()
				returning "nMHid" into nMHid;
				
                OPEN ref FOR SELECT 1 AS msg, 'Inserted' AS value, nMHid AS "nMHid";

else

  OPEN ref FOR SELECT -1 AS msg, 'Duplicate of last entry' AS value;

end if;

 

	
		
              /*  WITH last_row AS (
                SELECT "nSesid","nUserid","nFSid","nDocid","nHid","cType", "nBundledetailid"
                FROM realtime."MarkNavHistory"
                WHERE 
				"nUserid" IS NOT DISTINCT FROM nUserid
				and "nSesid" IS NOT DISTINCT FROM nSesid
                ORDER BY "dCreateDt" DESC
                LIMIT 1
                ), ins AS (
                INSERT INTO realtime."MarkNavHistory"
                    ("nSesid","nUserid","nFSid","nDocid","nHid","cType", "dCreateDt")
                SELECT nSesid, nUserid, nFSid, nDocid, nHid, cType, now()
                WHERE NOT EXISTS (
                    SELECT 1 FROM last_row lr
                    WHERE lr."nSesid" IS NOT DISTINCT FROM nSesid
                    AND lr."nUserid" IS NOT DISTINCT FROM nUserid
                    AND lr."nFSid"  IS NOT DISTINCT FROM nFSid
                    AND lr."nDocid" IS NOT DISTINCT FROM nDocid
                    AND lr."nHid"   IS NOT DISTINCT FROM nHid
                    AND lr."cType"  IS NOT DISTINCT FROM cType
                )
                RETURNING "nMHid"
                )
                SELECT "nMHid" INTO nMHid FROM ins;

                IF nMHid IS NOT NULL THEN
                    OPEN ref FOR SELECT 1 AS msg, 'Inserted' AS value, nMHid AS "nMHid";
                ELSE
                    OPEN ref FOR SELECT -1 AS msg, 'Duplicate of last entry' AS value;
                END IF;*/
	
    -- END IF;

    -- Soft Delete History
    ELSIF(cPermission = 'D') THEN
       
            CASE cTimeFrame
                WHEN '1W' THEN vInterval := interval '1 week';
                WHEN '2W' THEN vInterval := interval '2 weeks';
                WHEN '1M' THEN vInterval := interval '1 month';
                ELSE vInterval := NULL; -- no filter if not provided
            END CASE;

                IF cType = 'A' THEN
                DELETE FROM realtime."MarkNavHistory"
                WHERE "nUserid" = nUserid
                AND 
				(
				"nSesid" = nSesid
				OR "nBundledetailid" = nBundledetailid
				)
                AND (vInterval IS NULL OR "dCreateDt" >= now() - vInterval);

                ELSIF cType IN ('QF','F','QM','D', 'FL') THEN
                DELETE FROM realtime."MarkNavHistory"
                WHERE "nUserid" = nUserid
                AND (
				"nSesid" = nSesid
				OR "nBundledetailid" = nBundledetailid
				)
                AND "cType" = cType
                AND (vInterval IS NULL OR "dCreateDt" >= now() - vInterval);

                ELSIF cType = 'AL' THEN
                DELETE FROM realtime."MarkNavHistory"
                WHERE "nUserid" = nUserid
                AND
				(
				"nSesid" = nSesid
				OR "nBundledetailid" = nBundledetailid
				)
                AND "cType" IN ('D','FL')
                AND (vInterval IS NULL OR "dCreateDt" >= now() - vInterval);
            END IF;

            OPEN ref FOR 
                SELECT 1 AS msg,'Deleted' AS value;
    END IF;

    RETURN ref;
END;
$function$
