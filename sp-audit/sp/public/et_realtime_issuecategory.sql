CREATE OR REPLACE FUNCTION public.et_realtime_issuecategory(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid; nUserid uuid;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
--select * From ""IssueCategory"" order by  1 desc
open ref for 

select * From (
select c."nICid", c."cCategory" from "IssueCategory" c
where c."nCaseid" = nCaseid and c."cICtype" = 'U'
union all
select ic."nICid", ic."cCategory" from "IssueCategory" ic
where ic."nCaseid" = nCaseid and ic."nUserid" = nUserid and coalesce(ic."cICtype",'') != 'U'
) dt
order by dt."cCategory";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
