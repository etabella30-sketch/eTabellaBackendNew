CREATE OR REPLACE FUNCTION public.et_teambuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid UUID;nCaseid UUID;cPermission text;
nTeamid UUID;cTeamname text;cClr text;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
nCaseid := (parameter ->>'nCaseid')::UUID;
nTeamid := (parameter ->>'nTeamid')::UUID;
cTeamname := parameter ->>'cTeamname';
cClr := parameter ->>'cClr';
cPermission := parameter ->>'permission';

/*
 select * from et_teambuilder('{"nMasterid":2,"nTeamid":883,"cTeamname":"ALPHA DEMO 2","cClr":"red","permission":"N","nCaseid":22}','r1');FETCH All in "r1"
 
 select * from "TeamMaster" order by 1 desc limit 1
*/

    if(cPermission = 'N')then

        if not exists (select * from "TeamMaster" where "nCaseid" = nCaseid and upper(trim("cTeamname")) = upper(trim(cTeamname)) )then
            insert into "TeamMaster"("cTeamname","nCaseid","dCreateDt","nCreateId","cClr")
            values(cTeamname,nCaseid,now(),nMasterid,cClr) 
			returning "nTeamid" into nTeamid
            ;
            
            open ref for 
                select 1 as msg,'Team created successful' as value,nTeamid as "nTeamid";
            
        else
            open ref for
                select -1 as msg,'Team already exists' as value;
        end if;

    end if;
    
    
    
    
    if(cPermission = 'E')then

        if not exists (select * from "TeamMaster" where "nCaseid" = nCaseid and upper(trim("cTeamname")) = upper(trim(cTeamname)) and "nTeamid"!=nTeamid )then
            
            update "TeamMaster" set "cTeamname" = cTeamname ,"cClr" = cClr,"dUpdateDt"=now(),"nUpdateId"=nMasterid where "nTeamid" = nTeamid;
            
            open ref for 
                select 1 as msg,'Team updated successful' as value,nTeamid as "nTeamid";
            
        else
            open ref for
                select -1 as msg,'Team already exists' as value;
        end if;

    end if;
    
    
    
    if(cPermission = 'D')then
        

        delete from "UserSetting" us where "nCaseid" = nCaseid and
        exists (select * from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = us."nUserid");
        
        delete from "TeamMaster" where "nTeamid" = nTeamid;
        
        delete from "TeamRelation" where "nTeamid" = nTeamid;
        
        open ref for 
            select 1 as msg,'Team deleted' as value;
    end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
