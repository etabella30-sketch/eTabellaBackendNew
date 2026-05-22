CREATE OR REPLACE FUNCTION download.et_process_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
nDPid uuid;

BEGIN

nDPid := parameter ->> 'nDPid';

/*

select * from download.et_process_detail('{"nDPid":1}','r');fetch all in "r"

 select * from et_download_getdata('{"nCaseid":1150,"nSectionid":9425,"nMasterid":59}','r');fetch all in "r"

*/
 
nDPid := NULLIF(parameter ->>'nDPid','')::uuid;

open ref for
select p.*,c."cCasename" as "cZipname"
From download."ProcessMaster" p 
join "CaseMaster" c on c."nCaseid" = p."nCaseid"
join "SectionMaster" s on s."nSectionid" = p."nSectionid"
where "nDPid" = nDPid
;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
