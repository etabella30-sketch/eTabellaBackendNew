CREATE OR REPLACE FUNCTION helpcenter.et_help_module_iu(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;
	cTitle text;
	cImage text;
	cPermission text;
	nMainid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cTitle := parameter ->>'cTitle';
cImage := parameter ->>'cImage';
cPermission := parameter ->>'cPermission';
nMainid := NULLIF(parameter ->>'nMainid','')::uuid;

/*  

select * from helpcenter.et_help_module_iu('{""cTitle"": ""cTitle"", ""cImage"": ""cImage"", ""nMainid"": 0, ""cPermission"": ""I""}','r');fetch all in ""r""
select * from helpcenter."Module"
*/

if(cPermission = 'I') then
			if(exists(select 1 from helpcenter."Module" where "cTitle" = cTitle)) then
					open ref for
						select -1 as msg,'Title already exists' as value;
	
					else 
						insert into helpcenter."Module"("cTitle","cImage") values(cTitle, cImage);
		
					open ref for
						select 1 as msg,'inserted' as value;
			end if;

elsif (cPermission = 'U') then

		if(exists(select 1 from helpcenter."Module" where "nMainid" = nMainid)) then

			if(exists(select 1 from helpcenter."Module" where "cTitle" = cTitle and "nMainid" != nMainid)) then
				open ref for
					select -1 as msg,'Title already exists' as value;

			else 
				update helpcenter."Module"
				set "cTitle" = cTitle, "cImage" = cImage
				where "nMainid" = nMainid;

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
