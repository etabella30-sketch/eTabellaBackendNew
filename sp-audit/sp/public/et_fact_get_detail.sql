CREATE OR REPLACE FUNCTION public.et_fact_get_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    jFSids jsonb;
    nMasterid uuid;
BEGIN
    -- Extract and convert the nFSids array from the JSON parameter
--  SELECT et_fact_get_detail('{""jFSids"":""[1,2,3]""}', 'r');fetch all in ""r"";
    -- Extract nMasterid from the JSON parameter (if needed)
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    jFSids := parameter->>'jFSids';
   -- select * from et_fact_get_detail ('{""jFSids"":""[710,706]"",""nMasterid"":2}','r1');fetch all in ""r1"";
	-- select * from "FactDetail" order by 1 desc
    -- Open the cursor for the desired query
    OPEN ref FOR
    SELECT 
        f."nFSid",
        f."dCreateDt",
        um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
        fd."nFiletype",
        fd."nTZid",
        tz."cCodename" AS "cTimezone",
        "jLinktype",
        fd."cType",
        f."cFType",
        fd."jTexts",
		fd."jOT",
        fd."nColorid",
        fd."nStatus",
        cl."cColor" AS "cColor",
		fd."jDate",
		cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus",
		ftp."cCodename" as "cFiletype",
		count(distinct fls."nFMSdid") as t_shared,
		count(distinct flt."nFMTsid") as t_tasks,
		count(distinct flc."nFMCid") as t_contact,
		f."nUserid",
		 bd."nBundledetailid",
    	bd."cFilename",
    	bd."cTab",
    	bd."cExhibitno",
    	bd."cBundletag",
		fd."cIsNote",
		fd."bIsHighlighted",
		array_agg(distinct flc."nContactid") as "jContactids"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
	join bundlesource bd on bd."nBundledetailid" = f."nBundledetailid" 
		-- select * from "FMContact"
	left join "FMShared" fls on fls."nFSid" = f."nFSid" 
	left join "FMTasks" flt on flt."nFSid" = f."nFSid" 
	left join "FMContact" flc on flc."nFSid" = f."nFSid" 

	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'type')::int
    left JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
    left JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE jFSids @> to_jsonb(f."nFSid"::text) --f."nFSid" = ANY(jFSids)
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",
        fd."nFiletype",fd."nTZid", tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		cm."cCodename",st."cCodename",ftp."cCodename",	f."nUserid",
		 bd."nBundledetailid",
    	bd."cFilename",
    	bd."cTab",
    	bd."cExhibitno",
    	bd."cBundletag",
		fd."cIsNote",
		fd."bIsHighlighted";

    RETURN ref;
END;
$function$
