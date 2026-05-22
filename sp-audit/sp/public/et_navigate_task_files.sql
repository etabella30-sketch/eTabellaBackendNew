CREATE OR REPLACE FUNCTION public.et_navigate_task_files(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare 
    nMasterid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    docids uuid[];

BEGIN
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;

/*
select * from et_navigate_task_files ('{""nBundledetailid"":555366,""cTasktype"":""FT"",""nMasterid"":2}','r1','r2');
fetch all in ""r1"";fetch all in ""r2"";
select * from ""FactMaster"" order by 1 desc
select * from ""FMShared"" order by 1 desc

select * From ""BDTasks""

*/

open ref1 for 
select 	t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
	td."nProgress",td."jTimeline" ,pr."cCodename" "cPriority"
	From "BDTasks" b
	join "TaskMaster" t on t."nTaskid" = b."nTaskid"
	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	left join "Codemaster" pr on pr."nCodeid" = td."nPriority" 
	where b."nBundledetailid" = nBundledetailid and b."nUserid" = nMasterid;
RETURN next ref1;     

open ref2 for 
select jsonb_agg(b."nTaskid") as "jTaskids",
	u."cFname",u."cLname",u."cEmail",u."cProfile"
	from "BDTasks" b
	join "TaskShared" s on s."nTaskid" = b."nTaskid"
	join "UserMaster" u on u."nUserid" = s."nTaskid"
	where b."nBundledetailid" = nBundledetailid and b."nUserid" = nMasterid
	group by u."cFname",u."cLname",u."cEmail",u."cProfile";
RETURN next ref2;

    END;
$function$
