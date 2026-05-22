CREATE OR REPLACE FUNCTION public.et_pagination_nonpaginate_filedata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;jsonData jsonb;jPagination jsonb;
jIds jsonb;
jBundles uuid[];
nStartpage int;
nPtaskid uuid;jUsers jsonb;
nLogid uuid;
msgvalue text;

-- select * from "BundleDetail" 
BEGIN
-- select * from et_pagination_getdata('{""nSectionid"":72,""nBundleid"":6112,""nBundledetailid"":44174,""cRefpage"":""1-62"",""jPagination"":{""bc"": ""#fff"",""fc"": ""#000"",""fs"": ""16"",""ft"": ""arial"",""isHide"": false,""position"": ""BR""},""bPagedefault"":false}','r');fetch all in ""r"";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter->>'nSectionid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
jPagination = '{ "fs": "16", "ft": "arial", "fc": "#000", "bc": "#fff", "cb": "#ffffff00", "position": "BR", "isHide": false }'::jsonb;

nStartpage := 1;

	select jsonb_agg(t) into jsonData from(
		select bd."nBundledetailid" "nID",bd."cTab",bd."cPath",bd."cPage" "cRefpage",jPagination "jPagination",'' "cPTab",0 "nPStart",ba."cFVer" from "BundleDetail" bd
		join "SectionMaster" s on s."nSectionid" = bd."nSectionid"
		join "BDAttributes" ba on ba."nBundledetailid" =bd."nBundledetailid"
		where "cStatus" = 'C' and upper("cFiletype") = 'PDF' and bd."cIsindex" = false
		and case when nSectionid IS NOT NULL then bd."nSectionid" = nSectionid else s."nCaseid" = nCaseid and s."cFoldertype" = 'MB' end	
		and bd."cRefpage" is null and coalesce(bd."cTab",'') != ''
	) t;

		raise notice 'jsonData 2 length %', jsonb_array_length(jsonData);
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
			RETURNING "nPtaskid" INTO nPtaskid;
						
			insert into "PTaskDetail" ("nPtaskid","nID","cTab","cRefpage")
			select nPtaskid,"nID","cTab","cRefpage" from jsonb_populate_recordset(null::record,jsonData) as (
			"nID" uuid,"cTab" text, "cRefpage" varchar(20)) where "nID" IS NOT NULL;
			
				-- select * from "TeamRelation"
					select jsonb_agg(distinct us."nUserid") into jUsers 
					from "UserSetting" us
					left join "UserMaster" um on us."nUserid" = um."nUserid" 
					left join "TeamRelation" tr on us."nUserid" = tr."nUserid" 
					where um."isAdmin" = true or
					 (tr."nCaseid" = nCaseid and tr."nRoleid" = '2133ed3e-2878-4083-a597-eedd61307ac4'::uuid);
			-- select * from "UserLog"
					 insert into "UserLog"("nLCatid","nUserid","jOther")
					 values(25,nMasterid,parameter)
					   RETURNING "nLogid" INTO nLogid;
			
					 
						
			open ref for
			select nStartpage,jUsers "jUsers",1 as msg,jsonData "jsonData",true "isPagination",nPtaskid "nPtaskid",nCaseid "nCaseid",nLogid "nLogid"
			;
		else 
					
		open ref for
		select -1 as msg,coalesce(msgvalue,'File not found for paginate (Check Tab reference or other things)') value
		;
			
		end if;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
