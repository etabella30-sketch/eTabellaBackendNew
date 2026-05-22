CREATE OR REPLACE FUNCTION helpcenter.et_help_sub_module_iu(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;
	nMainid uuid;
	cTitle text;
	cLink text;
	cDescription text;
	cPermission text;
	nSMid uuid;
	jTags jsonb;

	

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nMainid := NULLIF(parameter ->>'nMainid','')::uuid;
cTitle := parameter ->>'cTitle';
cLink := parameter ->>'cLink';
cDescription := parameter ->>'cDescription';
cPermission := parameter ->>'cPermission';
nSMid := NULLIF(parameter ->>'nSMid','')::uuid;
jTags := parameter ->>'jTags';
/*  

select * from helpcenter.et_help_sub_module_iu('{"cTitle": "cTitle", "nMasterid": 464, "cImage": "cImage"}','r');fetch all in "r"

select * from helpcenter."SubModule"
*/

-- insert into helpcenter."SubModule"("nMainid", "cTitle", "cLink", "cDescription") values(nMainid, cTitle, cLink, cDescription);

if(cPermission = 'I') then
			-- if(exists(select 1 from helpcenter."SubModule" where "cTitle" = cTitle and "nMainid" = nMainid)) then
			IF EXISTS (SELECT 1 FROM helpcenter."SubModule" WHERE "cTitle" = cTitle AND "nMainid" = nMainid ) then
					open ref for
						select -1 as msg,'Title already exists' as value;
	
			else
				insert into helpcenter."SubModule"("nMainid", "cTitle", "cLink", "cDescription", "jTags") values (nMainid, cTitle, cLink, cDescription, jTags);
		
				open ref for
					select 1 as msg,'inserted' as value;
			end if;

elsif (cPermission = 'U') then

		-- if(exists(select 1 from helpcenter."SubModule" where "nSMid" = nSMid)) then
		 IF EXISTS (SELECT 1 FROM helpcenter."SubModule" WHERE "nSMid" = nSMid ) THEN

			-- if(exists(select 1 from helpcenter."SubModule" where "cTitle" = cTitle and "nMainid" = nMainid and "nSMid" != nSMid)) then
			 IF EXISTS (SELECT 1 FROM helpcenter."SubModule" WHERE "cTitle" = cTitle AND "nMainid" = nMainid AND "nSMid" != nSMid) THEN
				open ref for
					select -1 as msg,'Title already exists' as value;
			else 
				update helpcenter."SubModule"
				set "cTitle" = cTitle, "cLink" = cLink, "cDescription" = cDescription, "jTags"= jTags
				where "nSMid" = nSMid;

			open ref for
				select 1 as msg,'updated' as value;

			end if;
		else
			open ref for
				select -1 as msg,'Not Found' as value;

		end if;

else 
	open ref for
		select -1 as msg,'Wrong Permission' as value;
end if;

RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
