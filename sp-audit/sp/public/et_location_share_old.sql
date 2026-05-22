CREATE OR REPLACE FUNCTION public.et_location_share_old(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;
jUsers jsonb;nBundledetailid uuid;jNotify jsonb;nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jUsers := parameter ->>'jUsers';
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

-- select * from et_location_share ('{""nBundledetailid"":555366,""jUsers"":""[2,142,361,10]"",""nMasterid"":2}','r1');fetch all in ""r1"";
-- select * from ""BundleDetail"" limit 0

nCaseid := (select s."nCaseid" from "SectionMaster" s join "BundleDetail" bd on bd."nSectionid" = s."nSectionid" where bd."nBundledetailid" = nBundledetailid limit 1);

	with location as (
		
		select nMasterid as "nMasterid",nBundledetailid as "nBundledetailid",i."value"::uuid  as "nUserid"
		from jsonb_array_elements_text(jUsers)  AS i(value)
		--where not exists (select * from ""LocationShare"" l where l.""nBundledetailid"" = nBundledetailid 
		--and l.""nShareby"" = nMasterid and i.""value""::int = l.""nUserid"")
		
	),tbl as ( select u."nUserid",'Document shared' as "cTitle",
		cr."cFname" || ' ' || cr."cLname"  || ' has shared document with you' as "cMsg",
		s."nBundledetailid",u."cToken",'LS' as "cType",nCaseid as "nCaseid"
		
		from "UserMaster" u
		join location s on s."nUserid" = u."nUserid"
	
		join "UserMaster" cr on cr."nUserid" = s."nMasterid"
		where  nullif(u."cToken",'') is not null
		) select jsonb_agg(t) into jNotify from tbl t;

	delete from "LocationShare" where "nShareby" = nMasterid and "nBundledetailid" = nBundledetailid;

	insert into "LocationShare"("nShareby","nBundledetailid","nUserid")
	select nMasterid,nBundledetailid,i."value"::uuid from jsonb_array_elements_text(jUsers)  AS i(value);

	
	open ref for select 1 as msg,'Shared' as value,coalesce(jNotify,'[]'::jsonb) as "jNotify";

    RETURN ref;
END;
$function$
