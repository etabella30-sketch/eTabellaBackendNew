CREATE OR REPLACE FUNCTION public.et_web_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nWebid uuid;
nBundledetailid uuid;
nMasterid uuid; 
cUrl text;cTitle text;cNote text;cType text;
jLinktype jsonb;cImg text;cFavicon text;cTooltype text;
jAn jsonb;jTeams jsonb;jOText jsonb;nCaseid uuid;jNotify jsonb; nPMid int;
-- select * from ""WebMaster""
-- select * from ""WebDetail""
-- alter table ""WebDetail"" add column ""jOText"" jsonb
-- select * from et_web_insert ('{""nBDid"":555364,""cUrl"":""https://fb.com"",""jAn"":""[{\""isTemp\"":true,\""id\"":0,\""linktype\"":\""F\"",\""type\"":\""strikeout\"",\""color\"":\""#0066FF\"",\""uuid\"":\""40d498df-b0f2-45bf-99cc-9f4929892a00\"",\""page\"":15,\""rects\"":[{\""x\"":228.76300048828125,\""y\"":82.34765625,\""width\"":295.35552978515625,\""height\"":10.5},{\""x\"":141.90234375,\""y\"":103.40625,\""width\"":381.56488037109375,\""height\"":9},{\""x\"":141.90234375,\""y\"":104.15625,\""width\"":381.56488037109375,\""height\"":10.5},{\""x\"":141.90234375,\""y\"":125.30859375,\""width\"":382.40533447265625,\""height\"":9},{\""x\"":141.90234375,\""y\"":126.05859375,\""width\"":382.40533447265625,\""height\"":10.5},{\""x\"":141.90234375,\""y\"":147.9609375,\""width\"":91.43106079101562,\""height\"":10.5}]}]"",""cTitle"":""Facebook – log in or sign up"",""cNote"":""Log in to Facebook to start sharing and connecting with your friends, family and people you know."",""cFavicon"":""https://static.xx.fbcdn.net/rsrc.php/yv/r/B8BxsscfVBr.ico"",""cImg"":""screenshot/case289/web_1720331293366.png"",""jUsers"":""[]"",""cType"":""S"",""nMasterid"":2}','r1');fetch all in ""r1"";

BEGIN
nBundledetailid := NULLIF(parameter->>'nBDid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

cUrl := parameter->>'cUrl';
cTitle := parameter->>'cTitle';
cNote := parameter->>'cNote';
cType := parameter->>'cType';
jLinktype := parameter->>'jLinktype';
cImg := parameter->>'cImg';
cFavicon := parameter->>'cFavicon';
cTooltype := parameter->>'cTooltype';
jAn := parameter->>'jAn';
jTeams := parameter->>'jUsers';
jOText := parameter ->>'jOT';

nCaseid = (select s."nCaseid" from "SectionMaster" s join "BundleDetail" d on d."nSectionid" = s."nSectionid" where d."nBundledetailid" = nBundledetailid limit 1);

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

    insert into "WebMaster" ("nBundledetailid","nUserid","dCreateDt","nCaseid")
    values(nBundledetailid,nMasterid,now(),nCaseid)
    RETURNING "nWebid" INTO nWebid;
    
    -- select * from ""WebDetail""
    insert into "WebDetail" ("nWebid","cUrl","cTitle","cNote","cType","jLinktype","cImg","cFavicon","cTooltype","jOText")
    values(nWebid,cUrl,cTitle,cNote,cType,jLinktype,cImg,cFavicon,cTooltype,jOText);
    
    
    insert into "Annotations"("uuid","type","rects","lines","width","page","nWebid","dCreateDt")
    select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),"width","page",nWebid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"colorid" int,"page" int);
    
    
    insert into "WMShared" ("nWebid","nUserid")    
    SELECT nWebid,jsonb_array_elements_text(jTeams)::uuid AS i;

    with tbl as (select u."nUserid",'Web shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared weblink with you' as "cMsg",
        s."nWebid",u."cToken",'WS' as "cType",nCaseid as "nCaseid"
        
        from "UserMaster" u
        join "WMShared" s on s."nUserid" = u."nUserid"
        join "WebMaster" fm on fm."nWebid" = s."nWebid"
        join "UserMaster" cr on cr."nUserid" = fm."nUserid"
		left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
		where s."nWebid" = nWebid -- and nullif(u."cToken",'') is not null
		and coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 
		)    select jsonb_agg(t) into jNotify from tbl t;

    open ref for select 1 msg,nWebid "nWebid",coalesce(jNotify,'[]'::jsonb) as "jNotify";
    RETURN ref;
END;
$function$
