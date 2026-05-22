CREATE OR REPLACE FUNCTION realtime.et_annottransfer_insert_ref_quickmark(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSessionId uuid;nHid uuid;
nCaseid uuid;nLID uuid;nUserid uuid;
jNewData jsonb;

BEGIN

nSessionId := parameter->>'nSessionId';
nHid := parameter->>'nHid';
jNewData := parameter->>'jNewData';

/*
select * from realtime.et_annottransfer_insert_ref_quickmark ('{"cPageno":"2","cLineno":"8","nHid":"85a62374-0e48-4202-bd3a-7077c52b4008","calculatedPage":2,"line":9,"nRefresh":21}','r1');fetch all in "r1";

 select * from realtime.et_annottransfer_insert_ref_quickmark ('{"nSessionId":"0885f37f-b96a-4982-a45c-3d35b0fa8d84","nHid":"99d46168-6119-4fee-88e0-40b22dcb0ec7","jNewData":"[{\"cNote\":\"        Good morning, everyone, this is day 1 of the \",\"cPageno\":1,\"cLineno\":1,\"cTime\":\"09:14:22:25\",\"oP\":1,\"oL\":1,\"identity\":22502911684501}]"}','r1');fetch all in "r1";
 
alter table "RHighlights" add column "timeDiffernce" boolean
select * from "RHighlights" where "nSessionId" = '3fb59154-5e8d-4c0f-8619-83dd0d34fe6e' order by "dCreatedt" desc
select * from "RHighlightMapid" where "nHid" = '52041ec8-0a44-4991-abc5-fc67862dea14'
update "RHighlights" set "nRefHid" = null;
*/

	select "nCaseid","nLID","nUserid" into nCaseid,nLID,nUserid
	from "RHighlights" where "nHid" = nHid;

	-- insert here 
		drop table if exists temp_quickmarks;
		create temp table temp_quickmarks as 
		with dtl as (
				select * --"cNote","cPageno","cLineno","cTime","oP","oL","identity","previousIdentity"
				from jsonb_to_recordset(jNewData) as t("cNote" text,"cPageno" text,"cLineno" text,"cTime" text,"oP" int,"oL" int,"identity" text,"previousIdentity" text,"timeDiffernce" boolean)
				where not exists (
					select * from "RHighlights" r 
					where r."nHid" = nHid and r."nUserid" = nUserid  and r."cTime" = t."cTime"
					-- r."nRefHid" = nHid  and r."cTime" = t."cTime" and r."cPageno" = t."cPageno" 	and r."cLineno" = t."cLineno" and r."identity" = t."identity"
				)
		),update_op as (
			update "RHighlights" r set "identity" = t."identity" from dtl t where r."nHid" = nHid and t."previousIdentity" is not null and t."previousIdentity" = r."identity"
			returning r."identity","nHid", "nUserid", "nLID" -- r."nHid"
		),tbl as (
			insert into "RHighlights"("cNote", "nCaseid", "nSessionId", "nUserid", "dCreatedt", "cPageno", "cLineno","cTime","nLID","oP","oL","identity","nRefHid","timeDiffernce")
			select "cNote",nCaseid,nSessionId,nUserid,now(),"cPageno","cLineno","cTime",nLID,"oP","oL","identity" ,nHid,"timeDiffernce"
			from dtl where "previousIdentity" is null
			returning "identity","nHid", "nUserid", "nLID"
		),insert_maping as (
				insert into "RHighlightMapid"("serialno","nHid","nIid")
				select r."serialno",t."nHid",r."nIid" 
				From "RHighlightMapid" r,tbl t
				where r."nHid" = nHid
				returning 1
		)	
		select * from tbl t
		union all
		select * from update_op;
		
	
	open ref for 
		select t."identity",t."nHid", t."nUserid", t."nLID",r."cColor",
		--jsonb_agg(m."nIid" order by "serialno" desc) as "issueids"
		string_agg(m."nIid"::text, ',' ORDER BY m."serialno" DESC) AS issueids
		From temp_quickmarks t
		join "RHighlightMapid" m on m."nHid" = t."nHid"
		join "RIssueMaster" r on r."nIid" = t."nLID"
		group by t."identity",t."nHid", t."nUserid", t."nLID",r."cColor";
		
	-- select * from "RIssueMaster"
	--select 1 as msg,'Annotations Inserted' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
