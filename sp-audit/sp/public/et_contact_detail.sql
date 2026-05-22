CREATE OR REPLACE FUNCTION public.et_contact_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nContactid UUID;
    nMasterid UUID;
BEGIN
    nContactid := NULLIF(parameter ->> 'nContactid','')::uuid;
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
-- select * from et_contact_detail('{""nContactid"":82,""nMasterid"":2}','r');fetch all in ""r""
    OPEN ref FOR
    SELECT 
        c."nContactid",
        c."nCaseid",
        c."cProfile",
        c."cFname",
        c."cLname",
        c."cAlias",
        c."cLinkedin",
        c."cEmail",
        c."cCountrycode",
        c."cMobile",
        c."nTZid",
        c."nRoleid",
        CASE WHEN c."nCompanyid" IS NOT NULL THEN c."nCompanyid" ELSE '00000000-0000-0000-0000-000000000000'::uuid END AS "nCompanyid",
        c."cNote",
        tz."cCodename" AS "cTimezone",
        cr."cRole",
        cc."cCompany",
        c."nContactid" AS "nValue",
        (c."cFname" || ' ' || c."cLname") AS "cKey",
        c."cIso",
		c."cMentiontag",
		c."cOccupation",
		c."nPartyid",
		pr."cCodename" "cPartyName",
		count(distinct f."nFSid") as "nTotalfacts"
    FROM "ContactMaster" c
    LEFT JOIN "Codemaster" tz ON tz."nCodeid" = c."nTZid"
	LEFT JOIN "Codemaster" pr ON pr."nCodeid" = c."nPartyid"
    LEFT JOIN "ContactRole" cr ON cr."nCRoleid" = c."nRoleid"
    LEFT JOIN "ContactCompany" cc ON cc."nCompanyid" = c."nCompanyid"
	left join "FMContact" f on f."nContactid" = nContactid and f."nContactid" = c."nContactid"
		-- select * From "FMContact"
    WHERE c."nContactid" = nContactid 
		group by c."nContactid",
        c."nCaseid",
        c."cProfile",
        c."cFname",
        c."cLname",
        c."cAlias",
        c."cLinkedin",
        c."cEmail",
        c."cCountrycode",
        c."cMobile",
        c."nTZid",
        c."nRoleid",
        c."nCompanyid",
        c."cNote",
        tz."cCodename",
        cr."cRole",
        cc."cCompany",
        c."nContactid" ,
        c."cFname", c."cLname",
		pr."cCodename",
        c."cIso"; --AND c."nUserid" = nMasterid;
    RETURN ref;  -- Return the cursor to the caller
END;
$function$
