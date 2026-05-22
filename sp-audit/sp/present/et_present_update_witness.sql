CREATE OR REPLACE FUNCTION present.et_present_update_witness(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid; 
	nContactid uuid;
	nPCid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
nPCid := NULLIF(parameter ->>'nPCid','')::uuid;

/* 
select * from present.""PMContact""  where  ""nPCid"" = 8

select * from present.et_present_update_witness('{""nPCid"":8, ""nMasterid"": 366, ""nContactid"": 106}','r');fetch all in ""r""

*/

	if exists(select 1 from present."PMContact" where "nContactid" != nContactid and "nPCid" = nPCid)  then 
		update present."PMContact" 
		set "nContactid" = nContactid
		where "nPCid" = nPCid;

		open ref for
			select 1 as msg;
	
	else 
		open ref for
			select -1 as msg;
	end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
