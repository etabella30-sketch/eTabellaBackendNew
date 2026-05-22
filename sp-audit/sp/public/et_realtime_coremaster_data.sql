CREATE OR REPLACE FUNCTION public.et_realtime_coremaster_data(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare dDate date;cUnicuserid text;nUserid uuid;
BEGIN
dDate := parameter ->>'dDate';
cUnicuserid := parameter ->>'cUnicuserid';
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
/*

select * from et_realtime_coremaster_data('{""dDate"":""2024-09-12T11:34:44+05:30""}','r1');fetch all in ""r1"";

*/

 open ref for 
	 select "nCodeid", "nCategoryid", "cCodename", "nSerialno", "nParentcodeid", "nUserid" From "Codemaster" where "nCategoryid" in (4,5);

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
