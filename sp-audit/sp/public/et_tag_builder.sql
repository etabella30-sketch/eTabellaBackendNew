CREATE OR REPLACE FUNCTION public.et_tag_builder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare
nTagid uuid;nCaseid uuid;cTag text;cClr text;cDesc text;nParenttagid uuid;
nUserid uuid;permission text;cSubtag text;

-- select * from "TagMaster"
BEGIN

nTagid := NULLIF(parameter ->>'nTagid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cTag := parameter ->>'cTag';
cSubtag := parameter ->>'cSubtag';
cClr := parameter ->>'cClr';
cDesc := parameter ->>'cDesc';
nParenttagid := NULLIF(parameter ->>'nParenttagid','')::uuid;
permission := parameter ->>'permission';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;

--
-- select * from et_tag_builder ('{ "nMasterid":59,"nCaseid": 22, "nTagid": 2443, "cTag": "asdfasd", "cSubtag": "asdfas", "cDesc": "asdf", "nParenttagid": 2445, "permission": "E", "cClr": "ffa9a9"}','refcursor'); FETCH All in "refcursor";

-- select * from "TagMaster" where "nParenttagid" =50
if(permission = 'N')then

if not exists(select * from "TagMaster" where trim(upper("cTag")) = trim(upper(cTag)) and (("nParenttagid" IS NULL AND nParenttagid IS NULL) OR "nParenttagid" = nParenttagid) and "nCaseid" = nCaseid and "nUserid" = nUserid)then

insert into "TagMaster"("nCaseid","cTag","cClr","cDesc","nParenttagid","dCreateDt","nUserid")
values (nCaseid,cTag,cClr,cDesc,NULL,now(),nUserid)
RETURNING "nTagid" INTO nTagid;

if(coalesce(cSubtag,'')!='')then
	insert into "TagMaster"("nCaseid","cTag","cClr","cDesc","nParenttagid","dCreateDt","nUserid")
	values (nCaseid,cSubtag,cClr,cDesc,nTagid,now(),nUserid);
end if;

open ref for select 1 as msg,'Tag Insert successfully' as value,nTagid "nTagid";

else

open ref for select -1 as msg,'Tag Already Exists' as value;
end if;

end if;

if(permission = 'E')then

if not exists(select * from "TagMaster" where trim(upper("cTag")) = trim(upper(cTag)) and "nTagid" != nTagid and "nCaseid" = nCaseid and "nUserid" = nUserid and "nParenttagid" IS NULL)then

	update "TagMaster" set "cTag"=cTag,"cClr"=cClr,"cDesc"=cDesc,
	"dUpdateDt" = now()
	where "nTagid" = nTagid;

if(coalesce(cSubtag,'')!='')then
	if(nParenttagid IS NOT NULL) then 
		if not exists(select * from "TagMaster" where trim(upper("cTag")) = trim(upper(cSubtag)) and "nParenttagid" = nTagid and coalesce("nTagid",'00000000-0000-0000-0000-000000000000'::uuid) != nParenttagid and "nUserid" = nUserid)then
		
			update "TagMaster" set "cTag" = cSubtag,"cClr" = cClr,"cDesc" = cDesc where "nTagid" = nParenttagid;
			
		open ref for select 1 as msg,'Tag Updated' as value,nTagid "nTagid";
		else
			open ref for select -1 as msg,'Sub Tag Already exists in this tag' as value;
		end if;
	else
	
		if not exists(select * from "TagMaster" where trim(upper("cTag")) = trim(upper(cSubtag)) and "nParenttagid" = nTagid and "nUserid" = nUserid)then
		
			insert into "TagMaster"("nCaseid","cTag","cClr","cDesc","nParenttagid","dCreateDt","nUserid")
			values (nCaseid,cSubtag,cClr,cDesc,nTagid,now(),nUserid);
			
		open ref for select 1 as msg,'Tag Updated' as value,nTagid "nTagid";
		else
			open ref for select -1 as msg,'Sub Tag Already exists in this tag' as value;
		end if;
	end if;
	
else		
		open ref for select 1 as msg,'Tag Updated' as value,nTagid "nTagid";
end if;

else
open ref for select -1 as msg,'Tag Already Exists' as value;
end if;

end if;

 IF permission = 'D' THEN
		delete from "TagMaster" where "nTagid" = nTagid;		
	  	open ref for SELECT 1 AS msg, 'Deleted' AS value;
    END IF;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
