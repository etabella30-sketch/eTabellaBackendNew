CREATE OR REPLACE FUNCTION public.et_pagination_update_progress(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nPtaskid uuid;nQPtaskid uuid;nID uuid;cStatus text;isComplete boolean;isStop boolean;nUserid uuid;comp_progres int;total_prog int;cRefpage text;
cReason text;nCaseid uuid;jUsers jsonb;jPagination jsonb;cLVer text;
cPath text;
-- select * from et_pagination_update_progress ('{"nMasterid":59,"nPtaskid":34,"nID":326290,"cStatus":"C","isComplete":"","cRefpage":"1-2"}','r1');fetch all in "r1";
BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPtaskid := NULLIF(parameter ->>'nPtaskid','')::uuid;
nQPtaskid := NULLIF(parameter ->>'nQPtaskid','')::uuid;
cRefpage := parameter ->>'cRefpage';
cPath := parameter ->>'cPath';
nID := NULLIF(parameter ->>'nID','')::uuid;
cStatus := parameter ->>'cStatus';
isComplete:= case when coalesce((parameter ->>'isComplete'),'') = '' then false else coalesce((parameter ->>'isComplete'),'false')::boolean end;
isStop:= case when coalesce((parameter ->>'isStop'),'') = '' then false else coalesce((parameter ->>'isStop'),'false')::boolean end;
cReason:= parameter ->>'cReason';
cLVer := parameter ->>'cLVer';

	if(isComplete) then	
		update "BDAttributes" ba set "cIsPaginate" = false,"nPtaskid" = null  where "nPtaskid" = nPtaskid;
		if exists (select * from "Paginationtask" where "cStatus" = 'P' and ("nPtaskid" = nPtaskid or "nQPtaskid" = nPtaskid)) then
			update "Paginationtask" set "cStatus" = cStatus,"dUpdateDt" = now() where  "nPtaskid" = nPtaskid;
			update "Paginationtask" set "cStatus" = cStatus,"dUpdateDt" = now() where  "nQPtaskid" = nPtaskid;
			
		update "BDAttributes" ba set "cIsPaginate" = false,"nPtaskid" = null  from "Paginationtask" p where ba."nPtaskid" = p."nPtaskid" and ("nQPtaskid" = nPtaskid or p."nPtaskid" = nPtaskid);
		end if;
		
	elsif(isStop) then
		update "BDAttributes" ba set "cIsPaginate" = false,"nPtaskid" = null  where "nPtaskid" = nPtaskid;
		
		update "Paginationtask" set "cStatus" = 'S',"dStopDt" = now(),"nStopby" = nUserid where  "nPtaskid" = nPtaskid or "nQPtaskid" = nPtaskid;
		
		update "BDAttributes" ba set "cIsPaginate" = false,"nPtaskid" = null  from "Paginationtask" p where ba."nPtaskid" = p."nPtaskid" and ("nQPtaskid" = nPtaskid or p."nPtaskid" = nPtaskid);
	else
	
		select "jsonData" into jPagination from "Paginationtask" where "nPtaskid" = nPtaskid or "nQPtaskid" = nPtaskid limit 1;
	-- select * from "PTaskDetail" order by 1 desc
	-- ,"cPath" = cPath
	if(cStatus != 'F') then 
		update "BundleDetail" set "cRefpage" = cRefpage where "nBundledetailid" = nID;
		update "BDAttributes" set "cIsPaginate" = false,"jPagination" = jPagination,"nPtaskid" = null,"cLVer" = cLVer where "nBundledetailid" = nID;
		update "PTaskDetail" set "bIspaginate" = true  where "nID" = nID and "nPtaskid" = nPtaskid;
	end if;
	
		if(nQPtaskid IS NOT NULL) then 
			update "Paginationtask" set "nNoofcomp" = case when "nNoofcomp" >= "nNooffile" then "nNoofcomp" else  "nNoofcomp" + 1 end,"nLastBDid" = nID,"jFailBDid" = (case when  cStatus = 'F' then coalesce("jFailBDid",'[]'::jsonb) || ('[{"nID":"'|| nID ||'","cReason":"'|| coalesce(cReason,'') ||'"}]')::jsonb else "jFailBDid" end),"dUpdateDt"=now() where "nPtaskid" = nQPtaskid;
		else 
			update "Paginationtask" set "nNoofcomp" = case when "nNoofcomp" >= "nNooffile" then "nNoofcomp" else  "nNoofcomp" + 1 end,"nLastBDid" = nID,"jFailBDid" = (case when  cStatus = 'F' then coalesce("jFailBDid",'[]'::jsonb) || ('[{"nID":"'|| nID ||'","cReason":"'|| coalesce(cReason,'') ||'"}]')::jsonb else "jFailBDid" end),"dUpdateDt"=now() where "nPtaskid" = nPtaskid;
		end if;
	end if;
	
	select sum("nNooffile"),sum("nNoofcomp") into total_prog,comp_progres from "Paginationtask"	
	where "nPtaskid" = nPtaskid or "nQPtaskid" = nPtaskid ;
	select "cStatus","nUserid","nCaseid" into cStatus,nUserid,nCaseid from "Paginationtask" where "nPtaskid" = nPtaskid;

-- select * from "UserMaster" where "nUserid" = 43
		select jsonb_agg(distinct um."nUserid") into jUsers 
		from "UserMaster" um
		left join "TeamRelation" tr on um."nUserid" = tr."nUserid"
		where  um."isAdmin" = true  or
		 (tr."nCaseid" =  nCaseid  and tr."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid);

open ref for
select 1 as msg,nPtaskid "nPtaskid",comp_progres "comp_progres",total_prog "total_prog",cStatus "cStatus",nCaseid "nCaseid",jUsers "jUsers";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
