CREATE OR REPLACE FUNCTION present.et_present_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;nCaseid uuid;cName text;nContactid uuid;nTypeid int;nSTypeid int;
	jUsers jsonb;cStatus text;nPresentid uuid;nPCid uuid;nBundledetailid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cName := parameter ->>'cName';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
nTypeid := parameter ->>'nTypeid';
nSTypeid := parameter ->>'nSTypeid';
jUsers := parameter ->>'jUsers';
cStatus := parameter ->>'cStatus';

/*
select * From present."PresentationMaster"
select * From "PMContact"
select * From "PMUser"
select * From "PMDocuments"
select * From "PMSetupDetail"

truncate table "PresentationMaster" restart identity;
truncate table "PMContact" restart identity;
truncate table "PMUser" restart identity;
truncate table "PMDocuments" restart identity;
truncate table "PMSetupDetail" restart identity;

 select * from present.et_present_insert ('{"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","cName":"TERER","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","nContactid":null,"nTypeid":217,"nSTypeid":215,"jUsers":"[\"b834cc50-f8fd-47b9-802d-5d7c78313876\",\"0d21b929-ea05-4321-a33f-61ece00b4f4b\",\"48406438-a322-45a8-9391-d342b613fa06\",\"c67fea37-4c67-4ea4-89eb-f9d0441142a0\",\"5df08197-3300-4f79-8dd8-21db1975ed46\",\"d79f183b-c392-4862-bf94-45229c81e9d6\",\"1e4f0edf-4661-408d-974c-a1d87c4c3d44\",\"4093c055-d843-4567-b4e6-e3c2994f8f75\",\"5d813241-5840-44b5-9b50-8c93a12c3e3e\",\"97c1cb95-873b-4916-8e61-53f56ff7cd4b\",\"4337e269-a052-4e83-9a09-8d889e9c97df\",\"7c5207ca-cb6d-4caf-bc7f-7b3120cd7aff\",\"573b94e0-5d78-4165-a13b-f273d23d8007\"]","cStatus":"I"}','r1');fetch all in "r1";

 
select * from present.et_present_insert ('{"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","cName":"TERER","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","nContactid":null,"nTypeid":217,"nSTypeid":215,"jUsers":"[\"b834cc50-f8fd-47b9-802d-5d7c78313876\",\"0d21b929-ea05-4321-a33f-61ece00b4f4b\",\"48406438-a322-45a8-9391-d342b613fa06\",\"c67fea37-4c67-4ea4-89eb-f9d0441142a0\",\"5df08197-3300-4f79-8dd8-21db1975ed46\",\"d79f183b-c392-4862-bf94-45229c81e9d6\",\"1e4f0edf-4661-408d-974c-a1d87c4c3d44\",\"4093c055-d843-4567-b4e6-e3c2994f8f75\",\"5d813241-5840-44b5-9b50-8c93a12c3e3e\",\"97c1cb95-873b-4916-8e61-53f56ff7cd4b\",\"4337e269-a052-4e83-9a09-8d889e9c97df\",\"7c5207ca-cb6d-4caf-bc7f-7b3120cd7aff\",\"573b94e0-5d78-4165-a13b-f273d23d8007\"]","cStatus":"I"}','r1');fetch all in "r1";

*/

 /*
select t::uuid,'A' 
	from jsonb_array_elements_text('["b834cc50-f8fd-47b9-802d-5d7c78313876","0d21b929-ea05-4321-a33f-61ece00b4f4b","48406438-a322-45a8-9391-d342b613fa06","c67fea37-4c67-4ea4-89eb-f9d0441142a0","5df08197-3300-4f79-8dd8-21db1975ed46","d79f183b-c392-4862-bf94-45229c81e9d6","1e4f0edf-4661-408d-974c-a1d87c4c3d44","4093c055-d843-4567-b4e6-e3c2994f8f75","5d813241-5840-44b5-9b50-8c93a12c3e3e","97c1cb95-873b-4916-8e61-53f56ff7cd4b","4337e269-a052-4e83-9a09-8d889e9c97df","7c5207ca-cb6d-4caf-bc7f-7b3120cd7aff","573b94e0-5d78-4165-a13b-f273d23d8007"]') as t 
	on conflict ("nPresentid","nUserid")
	do update set "cStatus" = 'A';*/

-- if exists(select * from "PresentationMaster" where "nCaseid" = nCaseid and "nCreateid" = nMasterid and "cStatus" != 'C' )then
-- 	update "PresentationMaster" set "cStatus" = 'C',"dEndDt" = now() 
-- 	where "nCaseid" = nCaseid and "nCreateid" = nMasterid and "cStatus" != 'C';
-- end if;

if(nContactid IS NOT NULL)then
	insert into present."PMContact"("nCaseid","nContactid","nCreateid")
	values(nCaseid,nContactid,nMasterid) returning "nPCid" into nPCid;
end if;

update present."PresentationMaster" set "cStatus" = 'C' where "nCreateid" = nMasterid and "nTypeid" = nTypeid and "nCaseid" = nCaseid and "cStatus" in ('I', 'B');

insert into present."PresentationMaster"("cName","nCaseid","nTypeid","nSubtypeid","cStatus","nCreateid","nPCid")
values(cName,nCaseid,nTypeid,nSTypeid,coalesce(cStatus,'I'),nMasterid,nPCid) returning "nPresentid" into nPresentid;

if(jsonb_array_length(coalesce(jUsers,'[]'::jsonb))>0)then

	

	insert into present."PMUser"("nPresentid","nUserid","cStatus")
	select nPresentid,t::uuid,'A' 
	from jsonb_array_elements_text(jUsers) as t 
	on conflict ("nPresentid","nUserid")
	do update set "cStatus" = 'A';
	
end if;

select b."nBundledetailid" into nBundledetailid from "BundleDetail" b
	join "SectionMaster" s on s."nSectionid" = b."nSectionid" and "cFoldertype" = 'MB'
	left join "BDPermission" bp on bp."nBundledetailid" = b."nBundledetailid"
	where s."nCaseid" = nCaseid and "nBDPid" is null and b."cIsindex" = true limit 1;

open ref for
	select 1 as msg,nPresentid as "nPresentid",nBundledetailid "nBundledetailid";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
