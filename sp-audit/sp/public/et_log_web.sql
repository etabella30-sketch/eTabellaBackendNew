CREATE OR REPLACE FUNCTION public.et_log_web(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
	
	jData jsonb;
	
    v_jWebids jsonb;
    v_nWebid uuid;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
	
	jData := parameter->>'jData';
	
	v_jWebids := jData->>'jWebids';
    v_nWebid := NULLIF(jData->>'nWebid','')::uuid;
-- select * from ""FactMaster""
    -- Insert into the table
	if(v_nWebid IS NOT NULL) then 
	    INSERT INTO "LogWebMaster" ("nLCatid", "nWebid", "nMasterid",  "jOther")
	    VALUES (v_nLCatid, v_nWebid, v_nMasterid, jData)
	    RETURNING "nWebLogid" INTO inserted_id;
	end if;

	
	if(jsonb_array_length(v_jWebids) > 0) then
	    INSERT INTO "LogWebMaster" ("nLCatid", "nWebid", "nMasterid")
	    select v_nLCatid, nWebid::uuid, v_nMasterid from jsonb_array_elements_text(v_jWebids) nWebid;
	end if;
    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
