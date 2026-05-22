CREATE OR REPLACE FUNCTION realtime.et_annottransfer_updatecordinates_quickmark(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cPageno text;cLineno text;nHid uuid;
		calculatedPage text;line text;
		nRefresh int;cTime text;

		cOLDPageno text;cOLDLineno text;cOLDTime text;cNote text;cOLDNote text;

		cIdentity text;oldidentity text;
BEGIN
	cPageno := parameter ->>'cPageno';
	cLineno := parameter ->>'cLineno';
	nHid := parameter ->>'nHid';
	calculatedPage := parameter ->>'calculatedPage';
	line := parameter ->>'line';
	nRefresh := parameter ->>'nRefresh';
	cTime := parameter ->>'cTime';

	cOLDPageno := parameter ->>'cOLDPageno';
	cOLDLineno := parameter ->>'cOLDLineno';
	cOLDTime := parameter ->>'cOLDTime';
	
	cNote := parameter ->>'cNote';
	cOLDNote := parameter ->>'cOLDNote';
	
	cIdentity := parameter ->>'identity';
	oldidentity := parameter ->>'oldidentity';
/*
select * from realtime.et_annottransfer_updatecordinates_quickmark ('{"cPageno":"2","cLineno":"8","nHid":"85a62374-0e48-4202-bd3a-7077c52b4008","calculatedPage":2,"line":9,"nRefresh":21}','r1');fetch all in "r1";

*/

	-- select * From "RHighlights" order by "dCreatedt" desc limit 10
 -- select * From  realtime."RHighlightsLog"
 -- alter table realtime."RHighlightsLog" add column "identity" character varying(200)

update "RHighlights" set "cOPageno" = cOLDPageno,"cOLineno" = cOLDLineno  where "nHid" = nHid  and "cOPageno" is null;

-- ,"cTime" = cTime,"cNote" = cNote, "identity" =  cIdentity

if not exists (select * from realtime."RHighlightsLog" where "nHid" = nHid)then 
	
	insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity")
	values(nHid,cOLDPageno,cOLDLineno,nRefresh,cOLDTime,cOLDNote,oldidentity);

end if;

	insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity")
	values(nHid,cPageno,cLineno,nRefresh,cTime,cNote,cIdentity);

update "RHighlights" set "cPageno" = cPageno,"cLineno" = cLineno, "cTime" = cTime,"cNote" = cNote, "identity" =  cIdentity 
where "nHid" = nHid;

	
/*	update "RHighlights" set "cOPageno" = cPageno,"cOLineno" = cLineno  where "nHid" = nHid  and "cOPageno" is null;

	insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh")
	values(nHid,calculatedPage,line,nRefresh);

	update "RHighlights" set "cPageno" = calculatedPage,"cLineno" = line where "nHid" = nHid;*/

	open ref for select 1 as msg,'Annotations updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
