CREATE OR REPLACE FUNCTION public.et_upload_getcasedetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*

select * from et_upload_getcasedetail ('{""nCaseid"":1,""nMasterid"":2,""cPath"":""test2.pdf"",""nSectionid"":1,""nBundleid"":0}','refcursor'); FETCH All in ""refcursor"";

select * From ""TeamRelation"" where ""nCaseid"" = 22
select * From ""TeamMaster""
*/

open ref for 
    select c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt",tm."cTeamname"
    from "CaseMaster" c
    left join "TeamRelation" tr on tr."nUserid" = nMasterid and tr."nCaseid" = c."nCaseid"
    left join "TeamMaster" tm on tm."nTeamid" = tr."nTeamid"
    where c."nCaseid" = nCaseid;
        

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
