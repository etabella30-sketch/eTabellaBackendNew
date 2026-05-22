CREATE OR REPLACE FUNCTION public.et_task_insert_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nTaskid UUID;
    cSubject text;
    cDesc text;
    jEmailnotify jsonb;
    nClaimid int;
    nPriority int;
    nProgress int;
    jTimeline jsonb;
    nIssueid UUID;
    nImpactid int;
    nRelevanceid int;
    cTasktype text;
    cStatus text;
    permission text;
    
BEGIN
nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
cSubject := parameter ->> 'cSubject';
cDesc := parameter ->> 'cDesc';
jEmailnotify := parameter ->> 'jEmailnotify';
nClaimid := parameter ->> 'nClaimid';
nPriority := parameter ->> 'nPriority';
nProgress := parameter ->> 'nProgress';
jTimeline := parameter ->> 'jTimeline';
nIssueid := NULLIF(parameter ->> 'nIssueid','')::uuid;
nImpactid := parameter ->> 'nImpactid';
nRelevanceid := parameter ->> 'nRelevanceid';
cTasktype := parameter ->> 'cTasktype';
cStatus := parameter ->> 'cStatus';
permission := parameter ->> 'permission';
   
--  select * from ""TaskDetail""

    if(permission ='N') then 
   
        insert into "TaskDetail" ("nTaskid","cSubject","cDesc","jEmailnotify","nClaimid","nPriority","nProgress","jTimeline","nIssueid","nImpactid","nRelevanceid","cTasktype","cStatus")
        values(nTaskid,cSubject,cDesc,jEmailnotify,nClaimid,nPriority,nProgress,jTimeline,nIssueid,nImpactid,nRelevanceid,cTasktype,coalesce(cStatus,'P'));

        open ref for select 1 msg;
    
    end if;
    
    if(permission ='E') then 
    update "TaskDetail" set "cSubject" = cSubject,"cDesc" = cDesc,"jEmailnotify" = jEmailnotify,"nClaimid" = nClaimid,"nPriority" = nPriority,
	"nProgress" = nProgress,
	"cStatus" = CASE WHEN nProgress = 100 THEN 'C' ELSE "cStatus" END,
	"jTimeline" = jTimeline,"nIssueid" = nIssueid,"nImpactid" = nImpactid,"nRelevanceid" = nRelevanceid,"cTasktype"= cTasktype where "nTaskid" = nTaskid;
    
        open ref for select 1 msg;
    end if;

	 if(permission ='S') then 
 			update "TaskDetail" set "nProgress" = nProgress, "cStatus" = CASE WHEN nProgress = 100 THEN 'C' ELSE "cStatus" END where "nTaskid" = nTaskid;
			open ref for select 1 msg; 
	end if;
	 
    
    RETURN ref;  -- Return the cursor to the caller
END;
$function$
