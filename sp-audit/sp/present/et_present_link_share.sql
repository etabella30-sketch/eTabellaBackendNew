CREATE OR REPLACE FUNCTION present.et_present_link_share(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nBundledetailid uuid;nAId uuid;nPresentid uuid;isWithLink boolean;cPermission text;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nAId := NULLIF(parameter ->>'nAId','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
isWithLink := nullif((parameter ->>'bIsWithLink')::text,'');
cPermission := parameter ->>'cPermission';

/*

select * from present.et_present_link_share('{""nBundledetailid"":165549,""nPresentid"":9,""nAId"":10132,""isWithLink"":"""",""cPermission"":""N"", ""nMasterid"": 29}','r');fetch all in ""r""

select * From present."PMLinkShared"
truncate table present."PMLinkShared" restart identity
select * From "Annotations" where "nAId" = 10132
nBundledetailid 165549
*/

if(cPermission = 'N') then

	if not exists (select * from present."PMLinkShared" where "nPresentid" = nPresentid and "nBundledetailid" = nBundledetailid and "nAId" = nAId)then

		insert into present."PMLinkShared"("nBundledetailid","nPresentid","nAId","isWithLink","nUserid")
			select nBundledetailid,nPresentid,nAId,isWithLink,t."nUserid" 
			from present."PMUser" t
			where "nPresentid" = nPresentid and coalesce("cStatus",'A') = 'A';
	
	end if;
		open ref for 
				select a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page" ,
					case when isWithLink = true then
						coalesce(nullif(a."nFSid",'00000000-0000-0000-0000-000000000000'::uuid), 
							(coalesce(nullif(a."nDocid",'00000000-0000-0000-0000-000000000000'::uuid), a."nWebid" )) )
					else '00000000-0000-0000-0000-000000000000'::uuid end as "id",
			
					case when isWithLink = true then
						case 
							when a."nFSid" IS NOT NULL then 'F' 
							when a."nDocid" IS NOT NULL then 'D'
							when a."nWebid" IS NOT NULL then 'W'
						else
							'P' 
					end
					else 'P' end as "linktype"
					from annotations a where "nAId" = nAId ;

end if;

if(cPermission = 'D') then
	delete from present."PMLinkShared" where "nPresentid" = nPresentid and "nAId" = nAId;
	open ref for 
		select 1 as msg;
end if;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
