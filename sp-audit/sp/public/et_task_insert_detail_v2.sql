CREATE OR REPLACE FUNCTION public.et_task_insert_detail_v2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nTaskid UUID;
    cSubject text;
    cDesc text;
    jEmailnotify jsonb;
    nPriority int;
    nProgress int;
    jTimeline jsonb;
    cTasktype text;
    cStatus text;
    permission text;
	nStatus int;
	cAssign boolean;
	cRemind boolean;
	cStatusChange boolean;

	
-- From jTimeline
dStartDt date;
dEndDt date;

	
BEGIN
nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
cSubject := parameter ->> 'cSubject';
cDesc := parameter ->> 'cDesc';
jEmailnotify := parameter ->> 'jEmailnotify';
nPriority := parameter ->> 'nPriority';
nProgress := parameter ->> 'nProgress';
jTimeline := parameter ->> 'jTimeline';
cTasktype := parameter ->> 'cTasktype';
cStatus := parameter ->> 'cStatus';
permission := parameter ->> 'permission';
nStatus := parameter ->> 'nStatus';

-- Extract boolean flags from jEmailnotify
cAssign := (jEmailnotify ->> 'cAssign')::boolean;
cRemind := (jEmailnotify ->> 'cRemind')::boolean;
cStatusChange := (jEmailnotify ->> 'cStatusChange')::boolean;

-- Extract dates from jTimeline
dStartDt := (jTimeline ->> 'dStartDt')::timestamp;
dEndDt := (jTimeline ->> 'dEndDt')::timestamp;
	

--  select * from ""TaskDetail""

    if(permission ='N') then 
   
        insert into "TaskDetail" ("nTaskid","cSubject","cDesc","nPriority","nProgress","cTasktype","cStatus",
		 "nStatus", "cAssign", "cRemind", "cStatusChange","dStartDt", "dEndDt" )
        values(nTaskid,cSubject,cDesc,nPriority,nProgress,cTasktype,coalesce(cStatus,'P'),
		  nStatus, cAssign, cRemind, cStatusChange, dStartDt, dEndDt);

        open ref for select 1 msg;
    
    end if;
    
    if(permission ='E') then 
    update "TaskDetail" set "cSubject" = cSubject,
	"cDesc" = cDesc,
	"nPriority" = nPriority,
	"nProgress" = nProgress,
	"cStatus" = CASE WHEN nProgress = 100 THEN 'C' ELSE "cStatus" END,
	"jTimeline" = jTimeline,
	"cTasktype"= cTasktype,
	"nStatus" = nStatus,
	"cAssign" = cAssign,
	"cRemind" = cRemind,
	"cStatusChange" = cStatusChange,
	"dStartDt" = dStartDt,
	"dEndDt" = dEndDt
	where "nTaskid" = nTaskid;
    
        open ref for select 1 msg;
    end if;

	 if(permission ='S') then 
 			update "TaskDetail" set "nProgress" = nProgress, "cStatus" = CASE WHEN nProgress = 100 THEN 'C' ELSE "cStatus" END where "nTaskid" = nTaskid;
			open ref for select 1 msg; 
	end if;
	 
    
    RETURN ref;  -- Return the cursor to the caller
END;
$function$
