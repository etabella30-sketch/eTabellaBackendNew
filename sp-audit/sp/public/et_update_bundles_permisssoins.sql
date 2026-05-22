CREATE OR REPLACE FUNCTION public.et_update_bundles_permisssoins(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid; nBundledetailid uuid; nBundleid uuid; bPermit boolean; nUserid uuid; nTRid uuid;
nTeamid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
bPermit := parameter ->>'bPermit';
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nTeamid := NULLIF(parameter ->>'nTeamid','')::uuid;
/*
select * from et_update_bundles_permisssoins ('{
    ""nCaseid"": 22,
    ""nBundleid"": 0,
    ""nBundledetailid"": 528628,
    ""nUserid"": 0,
    ""nTeamid"": 108,
    ""bPermit"": true
}','r1');fetch all in ""r1"";
select * from et_update_bundles_permisssoins('{
    ""nCaseid"": 22,
    ""nBundleid"": 1342640,
    ""nBundledetailid"": 0,
    ""nUserid"": 0,
    ""nTeamid"": 109,
    ""bPermit"": true
}','r');fetch all in ""r"";
select * From ""BundleMaster"" where ""nSectionid"" = 92
select * From ""BDPermission"" where ""nUserid"" = 4 and ""nBundledetailid"" = 528452;
select * From ""BMPermission"" where ""nUserid"" = 4 and ""nBundleid"" = 142256;
select * from ""TeamRelation"" where ""nCaseid"" = 22
*/
if(nBundledetailid IS NOT NULL)then 
    
    if(bPermit)then
        if(nUserid IS NOT NULL)then
            delete from "BDPermission" where "nUserid" = nUserid and "nBundledetailid" = nBundledetailid;            
        else
            delete from "BDPermission" b where
            exists (select "nUserid" from "TeamRelation" t where "nTeamid" = nTeamid and t."nUserid" = b."nUserid" ) and b."nBundledetailid" = nBundledetailid;
        end if;
    else
        if(nUserid IS NOT NULL)then
            if not exists (select * From "BDPermission" where "nBundledetailid" = nBundledetailid and "nUserid" = nUserid)then
                nTRid = (select "nTRid" from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nUserid);
                insert into "BDPermission"("nUserid","nBundledetailid","nTRid")
                values(nUserid,nBundledetailid,nTRid);
            end if;
        else
        -- select * from ""BDPermission""
                insert into "BDPermission" ("nUserid","nBundledetailid","nTRid")
                    select distinct tr."nUserid",nBundledetailid,tr."nTRid"
                from ( select "nTRid","nUserid" from "TeamRelation" where "nCaseid" = nCaseid and "nTeamid" = nTeamid ) tr 
                left join "BDPermission" bm on bm."nUserid" = tr."nUserid" and bm."nBundledetailid" = nBundledetailid
                where "nBDPid" is null;
        end if;
    end if;

else
-- select * from ""BDPermission"" limit 10
    if(bPermit)then 
        if(nUserid IS NOT NULL)then    
        
            DELETE FROM "BMPermission" b
                USING fun_childers_bundles(nBundleid) t where b."nUserid" = nUserid and t."nBundleid" = b."nBundleid";
                    
        else
            DELETE FROM "BMPermission" b
                USING "TeamRelation" t, LATERAL fun_childers_bundles(nBundleid) AS fcb
                WHERE t."nTeamid" = nTeamid
                  AND t."nUserid" = b."nUserid"
                  AND fcb."nBundleid" = b."nBundleid" and b."nBundleid" = nBundleid;
        end if;
    else    
        if(nUserid IS NOT NULL)then            
                nTRid = (select "nTRid" from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nUserid);
                insert into "BMPermission" ("nUserid","nBundleid","nTRid")
                select nUserid,t."nBundleid",nTRid 
                from fun_childers_bundles(nBundleid) t where not exists (
                    select * from "BMPermission" bm where bm."nUserid" = nUserid and t."nBundleid" = bm."nBundleid"
                );        
        else 
                insert into "BMPermission" ("nUserid","nBundleid","nTRid")
                    select distinct tr."nUserid",t."nBundleid",tr."nTRid"
                from fun_childers_bundles(nBundleid) t 
                left join (select "nTRid","nUserid" from "TeamRelation" where "nCaseid" = nCaseid and "nTeamid" = nTeamid) tr on true 
                left join "BMPermission" bm on bm."nUserid" = tr."nUserid" and t."nBundleid" = bm."nBundleid"
                where "nBMPid" is null;
        end if;
    end if;

end if;

open ref for select 1 as msg,'Updated' as value;

 
 

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
