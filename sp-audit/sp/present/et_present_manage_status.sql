CREATE OR REPLACE FUNCTION present.et_present_manage_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;cStatus text;isStarted boolean default false;nCaseid uuid;nTypeid int;cType text;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cStatus := parameter ->>'cStatus';

/*
select * from present.et_present_manage_status ('{""nPresentid"":88,""nMasterid"":366,""cStatus"":""I""}','r1');fetch all in ""r1"";

select * from ""Annotations"" limit 1

select * from ""PMUser""
select * from present.""PresentationMaster"" where ""nPresentid"" = 88

select * from present.""PresentationMaster"" where ""nTypeid"" = (select ""nCodeid"" from ""Codemaster"" where ""nCodeid"" = 217 and ""jOther""->>'type' = 'G')
and ""cStatus"" in ('L', 'P') and ""nCaseid"" = 1079 and ""nPresentid"" != 91
not in ('I', 'B', 'C')

*/

if exists (select * from present."PresentationMaster" where "nPresentid" = nPresentid and "cStatus" in ('I','B') and cStatus = 'L' )then
	isStarted = true;
end if;

select  "nCaseid","nTypeid",(c."jOther"->>'type')::text into nCaseid,nTypeid ,cType
	from present."PresentationMaster" p
	join "Codemaster" c on c."nCodeid" = p."nTypeid" 
	where "nPresentid" = nPresentid;

if not exists (select * from present."PresentationMaster" where "nPresentid" != nPresentid and "nCaseid" = nCaseid and 
	case cType when 'G' then "nTypeid" = nTypeid else false end and "cStatus" not in ('I','B','C') and isStarted = true ) then

update present."PresentationMaster" set "cStatus" = coalesce(cStatus,'L'),"dStartDt" = case when coalesce(cStatus,'L') = 'L' then coalesce("dStartDt",now()) else "dStartDt" end ,"dEndDt" = case when cStatus = 'C' then now() else "dEndDt" end  where "nPresentid" = nPresentid;

open ref for 
	select 1 as msg,isStarted as "isStarted";

else
	
open ref for 
	select -1 as msg,'Presentation already exists for this case' as value;
	
	
end if;

	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
