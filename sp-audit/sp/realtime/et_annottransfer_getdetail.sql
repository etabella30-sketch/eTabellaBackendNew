CREATE OR REPLACE FUNCTION realtime.et_annottransfer_getdetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;cPageno int;cType text;jIdentities jsonb;
BEGIN
	nSesid := parameter ->>'nSesid';
	cPageno := nullif(parameter ->>'pageno','');
	cType := parameter ->>'cType';
	jIdentities := parameter ->>'jIdentities';

/*
select * from realtime.et_annottransfer_getdetail ('{"nSesid":"0885f37f-b96a-4982-a45c-3d35b0fa8d84","pageno":"","cType":"H","jIdentities":["22502911684501","22502911684501"]}','r1');fetch all in "r1";

*/
	if  (cType = 'I') then 

		open ref for 
			SELECT * FROM "RIssueDetail" where "nSessionid" = nSesid and nullif("cPageno",'')::int >= cPageno;
			
	else
		open ref for 
			SELECT * FROM "RHighlights" where "nSessionId" = nSesid and nullif("cPageno",'')::int >= cPageno --(jIdentities) @> to_jsonb("identity") --
			;

	end if;

	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
