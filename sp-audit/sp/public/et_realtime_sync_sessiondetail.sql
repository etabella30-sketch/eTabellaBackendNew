CREATE OR REPLACE FUNCTION public.et_realtime_sync_sessiondetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  jSDetail jsonb;jDetail jsonb; nComplete int;jUsers jsonb;

BEGIN

    jSDetail := parameter ->> 'jSDetail';

drop table if exists temp_sessiondetail;
create temp table temp_sessiondetail as
    select * 
    from jsonb_to_recordset(jSDetail) as ("nSDid" int,"nSesid" uuid,"nUserid" uuid,"cDefIssues" jsonb,"nLIid" uuid,"cDefHIssues" jsonb,"nLID" uuid,"nRefSDid" int);

update temp_sessiondetail t set "nRefSDid" = sd."nSDid" from "RSessionDetail" sd
where coalesce(t."nRefSDid",0) = 0 and sd."nSesid" = t."nSesid" and sd."nUserid" = t."nUserid";

with tbl as (
    select * from temp_sessiondetail
),insert_op as (
    insert into "RSessionDetail"("nSesid","nUserid","cDefHIssues","nLID","cDefIssues","nLIid")
    select "nSesid","nUserid","cDefHIssues","nLID","cDefIssues","nLIid" from tbl where coalesce("nRefSDid",0) = 0
    returning *
),update_temp as (
    update "temp_sessiondetail" t set "nRefSDid" = i."nSDid" from insert_op i where i."nSesid" = t."nSesid" and i."nUserid" = t."nUserid" 
    returning *
),update_op as (
    update "RSessionDetail" s set "cDefHIssues" = t."cDefHIssues","nLID" = t."nLID","cDefIssues" = t."cDefIssues","nLIid" = t."nLIid" 
    from tbl t where t."nSesid" = s."nSesid" and t."nUserid" = s."nUserid" 
    returning *
) select 1 into nComplete from insert_op t limit 1;

select jsonb_agg(t.*) into jDetail
    from (
        select "nSDid" as "nOSDid","nRefSDid" as "nSDid","nUserid" from temp_sessiondetail 
    ) t;

open ref for 
    select 1 as msg,coalesce(jDetail,'[]'::jsonb) as "jDetail";

    RETURN ref;
END;
$function$
