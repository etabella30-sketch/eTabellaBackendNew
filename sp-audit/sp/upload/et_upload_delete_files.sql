CREATE OR REPLACE FUNCTION upload.et_upload_delete_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE

    jItem jsonb;
    jDels jsonb;
	nMasterid uuid;
	nUPid uuid;
	bIsAll boolean;

	
rec RECORD;x record;
	
	
BEGIN
    -- Extract the tab id from the JSON parameter
    jDels := parameter ->> 'jDels';
	nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
	
/*

select * from upload.et_upload_delete_files ('{""jDels"":[{""nUPid"":2,""nUDids"":[],""bIsAll"":true},{""nUPid"":3,""nUDids"":[6,7],""bIsAll"":true},{""nUPid"":1,""nUDids"":[2],""bIsAll"":false}],""nMasterid"":464}','r1');fetch all in ""r1"";

select * from upload."UploadDetail" order by 1 desc

*/

			UPDATE upload."UploadDetail" u 
			SET "dDelDt" = now() from (
				select * From jsonb_to_recordset(jDels) as ("nUPid" uuid,"nUDids" jsonb,"bIsAll" boolean)
			) t
			WHERE u."nUPid" = t."nUPid"
			and
			case when t."bIsAll" then (t."nUDids" @> to_jsonb(u."nUDid")) = false else t."nUDids" @> to_jsonb(u."nUDid") end;
  	
    -- Open the refcursor for the caller
    OPEN ref FOR
         SELECT 1 AS msg, 'success' AS "value";

    RETURN ref;
END;
$function$
