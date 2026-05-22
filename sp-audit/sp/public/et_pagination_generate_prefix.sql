CREATE OR REPLACE FUNCTION public.et_pagination_generate_prefix(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;nBundledetailid uuid;
nBundleid uuid;jsonData jsonb;cRefpage text;jPagination jsonb;bPagedefault boolean;
bApplyall boolean;jIds jsonb;

bundlels jsonb;
nStartpage int; row_nm int;sPg int;
current_row_record record; prev_ref_value text;nPtaskid uuid;jUsers jsonb;
nLogid uuid;
msgvalue text;
bIslater boolean;
cStartPrefix text;
prefix text;suffix text;

-- select * from "BundleDetail" 
BEGIN
-- select * from et_pagination_getdata('{"nSectionid":72,"nBundleid":6112,"nBundledetailid":44174,"cRefpage":"1-62","jPagination":{"bc": "#fff","fc": "#000","fs": "16","ft": "arial","isHide": false,"position": "BR"},"bPagedefault":false}','r');fetch all in "r";
nMasterid := parameter ->>'nMasterid';
nSectionid := parameter->>'nSectionid';
nBundleid := parameter->>'nBundleid';
nBundledetailid := parameter->>'nBundledetailid';

cRefpage := parameter->>'cRefpage';
jPagination := parameter->>'jPagination';
bApplyall :=(case when coalesce((parameter->>'bApplyall')::text,'') = '' then 'false' else (parameter->>'bApplyall')::text end);
-- jPagination = '{"bc":"#fff","cb":"#ffffff00","fc":"#000","fs":"16","ft":"arial","isHide":"false","position":"BR"}'::jsonb;
bPagedefault := (case when coalesce((parameter->>'bPagedefault')::text,'') = '' then 'false' else (parameter->>'bPagedefault')::text end);
bIslater := parameter->>'bIslater';
cStartPrefix := parameter->>'cStartPrefix';

select "nCaseid" into nCaseid from "SectionMaster" where "nSectionid" = nSectionid;

raise notice 'nCaseid %',nSectionid; 

	SELECT (regexp_matches(cStartPrefix, '^(.*?)([A-Za-z]+)$'))[1],(regexp_matches(cStartPrefix, '^(.*?)([A-Za-z]+)$'))[2] into prefix, suffix;

   update "BDAttributes" bd set "cIsPaginate" = true where bd."nBundledetailid" = nBundledetailid;

select jsonb_agg(t) into bundlels from (
	select "nBundledetailid" "nID",cRefpage "cRefpage","cPage",jPagination "jPagination" FROM "BundleDetail" where "nBundledetailid" = nBundledetailid 
) t;

	update "BundleDetail" set  "cPrefix" =prefix where "nBundledetailid" = nBundledetailid ;

select jsonb_agg(distinct t),jsonb_agg(distinct t."nID") into jsonData,jIds from (
	select bIslater, prefix,suffix,bd."nBundledetailid" "nID",bd."cTab","cPath",t."cRefpage",t."jPagination","cFVer" from "BundleDetail"bd
	join "BDAttributes" ba on ba."nBundledetailid" = bd."nBundledetailid"
	,jsonb_populate_recordset(null::record,bundlels::jsonb) as t ("nID" uuid,"cRefpage" text,"jPagination" jsonb) 
	where bd."nBundledetailid" = t."nID" and coalesce(bd."cTab",'') !='' --and t."cRefpage" != bd."cRefpage"  --and coalesce("cRefpage",'') !=''
) t;

			    raise notice 'jsonData length %', jsonb_array_length(jsonData);

if(jsonb_array_length(jsonData) > 0 and exists (select 1 from "Paginationtask" where "jsonData" = jPagination and "cStatus" = 'P' and "nCaseid" = nCaseid and "jIds" = jIds)) then 
	jsonData := '[]'::jsonb;
	if(msgvalue = '') then
		msgvalue := 'Pagination already in queue';
	end if;
elsif(jsonb_array_length(jsonData) > 0) then 
	if(msgvalue = '') then
		msgvalue := 'No file found for paginate';
	end if;
end if;

		if(jsonb_array_length (jsonData)> 0) then
			insert into "Paginationtask" ("nUserid","nCaseid","nNooffile","nNoofcomp","nStartBDid","cStatus","dCreateDt","jIds","jsonData")
			values(nMasterid,nCaseid,jsonb_array_length(jsonData),0,((jsonData::jsonb->0)->> 'nID')::uuid,'P',now(),jIds,jPagination)
			returning "nPtaskid" into nPtaskid;
			-- select * from "PTaskDetail" limit 1;		
			-- select max("nPtaskid") into nPtaskid from "Paginationtask";

			insert into "PTaskDetail" ("nPtaskid","nID","cTab","cRefpage")
			select nPtaskid,"nID","cTab","cRefpage" from jsonb_populate_recordset(null::record,jsonData) as (
			"nID" uuid,"cTab" text,  "cRefpage" varchar(20)) where coalesce("nID",'00000000-0000-0000-0000-000000000000')::uuid != '00000000-0000-0000-0000-000000000000'::uuid;
			
				-- select * from "RoleMaster"
					select jsonb_agg(distinct us."nUserid") into jUsers 
					from "UserSetting" us
					left join "UserMaster" um on us."nUserid" = um."nUserid" 
					left join "TeamRelation" tr on us."nUserid" = tr."nUserid" 
					where  um."isAdmin" = true  or
					 (tr."nCaseid" = nCaseid  and tr."nRoleid" = (select "nRoleid" from "RoleMaster" where "nSrno" = 1));
			-- select * from "UserLog" limit  10
					 insert into "UserLog"("nLCatid","nUserid","jOther")
					 values(25,nMasterid,parameter)
					   RETURNING "nLogid" INTO nLogid;
			
					 
						
			open ref for
			select jUsers "jUsers",1 as msg,jsonData "jsonData",true "isPagination",nPtaskid "nPtaskid",nCaseid "nCaseid",nLogid "nLogid"
			;
		else 
					
		open ref for
		select -1 as msg,coalesce(msgvalue,'File not found for paginate (Check Tab reference or other things)') value
		;
			
		end if;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
