CREATE OR REPLACE FUNCTION present.et_present_home_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;nPrivateid uuid;nPublicid uuid; 

BEGIN
-- select * from present.et_present_home_detail('{""nCaseid"":1079, ""nMasterid"": 366}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*

select *from present.""PresentationMaster""  
select *from ""Codemaster""  where ""nCodeid"" = 216
*/

nPublicid = (select p."nPresentid" from present."PresentationMaster" p join "Codemaster" c on c."nCodeid" = p."nTypeid" where p."nCaseid" = nCaseid and "cStatus" not in ('C','B','I') and (c."jOther"->>'type')::text = 'G' limit 1);

nPrivateid = (select p."nPresentid" from present."PresentationMaster" p join "Codemaster" c on c."nCodeid" = p."nTypeid" where p."nCaseid" = nCaseid and p."nCreateid" = nMasterid and "cStatus" not in ('C','B','I') and (c."jOther"->>'type')::text = 'P' limit 1);

open ref for
		select nPrivateid as "nPrivateid",nPublicid as "nPublicid";

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
