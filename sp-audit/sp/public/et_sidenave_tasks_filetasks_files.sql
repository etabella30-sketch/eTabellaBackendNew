CREATE OR REPLACE FUNCTION public.et_sidenave_tasks_filetasks_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid; nTaskid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;
/*

select * From et_sidenave_tasks_filetasks_files('{""nMasterid"":2,""nTaskid"":""ALL"",""nCaseid"":289}','r1');fetch all in ""r1"";

select * from ""BDTasks""
select * from ""FMIssue""
select * from ""bundlesource""

*/

open ref for
    select b."nBundledetailid",b."cFilename",b."cTab",b."cExhibitno",b."cBundletag"
    From "BDTasks" t
    join bundlesource b on b."nBundledetailid" = t."nBundledetailid"
	left join "TaskShared" ts on ts."nTaskid" = t."nTaskid"
	where (t."nUserid" = nMasterid or ts."nUserid" = nMasterid) and t."nTaskid" = nTaskid;

    
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
