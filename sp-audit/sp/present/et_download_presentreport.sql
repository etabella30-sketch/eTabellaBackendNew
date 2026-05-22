CREATE OR REPLACE FUNCTION present.et_download_presentreport(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;
nTypeid int;
nSubtypeid INTEGER;
dStartDt DATE;
dEndDt DATE;
cPname text;
cFilename text;
v_jFiles_uuid uuid[];

BEGIN
-- select * from present.et_present_recent_files('{"nCaseid":1079, "nMasterid": 29}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nTypeid := parameter ->>'nTypeid';
nSubtypeid := (parameter ->> 'nSubtypeid');
dStartDt := NULLIF(parameter ->> 'dStartDt', '')::DATE;
dEndDt := NULLIF(parameter ->> 'dEndDt', '')::DATE;
cPname:= parameter ->>'cPname';
v_jFiles_uuid := (parameter ->>'jFiles')::uuid[];

	cFilename := case when cPname !='' and coalesce(cPname,'A')!='A' then cPname || '_' || dStartDt::text else dStartDt::text end;

open ref for

		SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename", --'/'|| pm."dCreateDt"::date ||'/' 
		'Presented Files' as Foldername,"cPath"	  
		from present."PMDocuments" pmd 
		join present."PresentationMaster" pm on pm."nPresentid" = pmd."nPresentid"
		join "BundleDetail" bd on bd."nBundledetailid" = pmd."nBundledetailid" 
		where pm."nCreateid"  = nMasterid and pm."cStatus" = 'C' and pm."nCaseid" =  nCaseid 
		AND case when nTypeid > 0 then pm."nTypeid" = nTypeid else true end 
		AND case when nSubtypeid IS NOT NULL then pm."nSubtypeid" = nSubtypeid else true end --  (nSubtypeid IS NULL OR pm."nSubtypeid" = nSubtypeid)
		AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND 
             pmd."dCreateDt"::DATE BETWEEN dStartDt AND dEndDt)
            OR
            (dStartDt IS NULL OR dEndDt IS NULL))	 
 and case when  coalesce(cPname,'A') !='A' and cPname !='' then pm."cName" = cPname else true end
 And case when array_length(v_jFiles_uuid, 1) is not null then bd."nBundledetailid" = ANY(v_jFiles_uuid) else true end
 group by --pm."dCreateDt"::date,
 bd."nBundledetailid",bd."cTab","cFiletype";

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
