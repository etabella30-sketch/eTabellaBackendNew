CREATE OR REPLACE FUNCTION public.et_pagination_getdata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;
bundlels jsonb;nPtaskid uuid;total_prog int;comp_progres int;jIds jsonb;
BEGIN
-- select * from et_pagination_getdata('{""nCaseid"":1041,""nPtaskid"":395}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPtaskid := NULLIF(parameter ->>'nPtaskid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

-- if(coalesce(nPtaskid,0) = 0) then
-- 	select min("nPtaskid") into nPtaskid from "Paginationtask" where "cStatus" = 'P' and "nCaseid" = nCaseid; 
-- end if;

	select sum("nNooffile"),sum("nNoofcomp") into total_prog,comp_progres from "Paginationtask"	
	where "nPtaskid" = nPtaskid or "nQPtaskid" = nPtaskid;
	-- select * from "BDAttributes" limit 2
	select jsonb_agg("nBundledetailid") into jIds from "BDAttributes" b
	join "Paginationtask" p on (p."nPtaskid" = nPtaskid or p."nQPtaskid" = nPtaskid) and p."jIds" @> to_jsonb(b."nBundledetailid")
	where "cIsPaginate" = true;

open ref for
select 1 as msg,total_prog,comp_progres,nPtaskid "nPtaskid",nCaseid "nCaseid",'P' "cStatus",jIds "jIds"
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
