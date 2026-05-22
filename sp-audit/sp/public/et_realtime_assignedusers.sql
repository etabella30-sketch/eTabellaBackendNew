CREATE OR REPLACE FUNCTION public.et_realtime_assignedusers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;nSesid uuid;

BEGIN

cUnicuserid := parameter ->> 'cUnicuserid';
nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;

/*
select * From "RSessionMaster" order by 1 desc
select * From "RSessionDetail" order by 1 desc

truncate table "RSessionMaster" restart identity
truncate table "RSessionDetail" restart identity

select * from et_realtime_assignedusers('{"cUnicuserid":"asd","nSesid":1}','r');fetch all in "r"

*/

 open ref for 
 
select um."nUserid",um."cFname",um."cLname" ,um."cProfile",true as "isSelected"
from  "UserMaster" um 
join "RSessionDetail" d on d."nUserid" = um."nUserid"
where "nSesid" = nSesid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
