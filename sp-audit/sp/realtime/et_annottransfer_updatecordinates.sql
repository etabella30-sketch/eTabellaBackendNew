CREATE OR REPLACE FUNCTION realtime.et_annottransfer_updatecordinates(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare jCordinates jsonb;
cONote text;newCordinates jsonb;nRefresh int;
jDCordinates jsonb;firstPage text;nIDid uuid;
BEGIN

jCordinates := parameter ->> 'jCordinates';
nIDid := parameter ->> 'nIDid';

cONote := parameter ->> 'cONote';
newCordinates := parameter ->> 'newCordinates';
nRefresh := parameter ->> 'nRefresh';
jDCordinates := parameter ->> 'jDCordinates';
firstPage := parameter ->> 'firstPage';

/*
 select * from realtime.et_annottransfer_updatecordinates ('{"jCordinates":"[{\"l\":6,\"p\":1,\"t\":\"09:06:05:07\",\"x\":174.39236450195312,\"y\":174.44094848632812,\"oL\":4,\"oP\":1,\"text\":\"N:  Good morning, everybody.  This is Day 2 of \",\"width\":325.01739501953125,\"height\":20,\"identity\":\"24604945041400\"},{\"l\":7,\"p\":1,\"t\":\"09:06:59:15\",\"x\":107.98611450195312,\"y\":198.44097900390625,\"oL\":5,\"oP\":1,\"text\":\"    DIFC-LCIA matter 21381.  A couple of housekeeping \",\"width\":377.482666015625,\"height\":20,\"identity\":\"24605087681800\"},{\"l\":8,\"p\":1,\"t\":\"09:07:06:22\",\"x\":107.98611450195312,\"y\":222.44094848632812,\"oL\":6,\"oP\":1,\"text\":\"    matters.  One of the claimant''''s legal representatives is \",\"width\":398.1944580078125,\"height\":20,\"identity\":\"24605137128500\"},{\"l\":9,\"p\":1,\"t\":\"09:07:10:13\",\"x\":107.98611450195312,\"y\":246.44097900390625,\"oL\":7,\"oP\":1,\"text\":\"    not here, but I''''ve just been told that the claimant is \",\"width\":375.2257080078125,\"height\":20,\"identity\":\"24605180005600\"},{\"l\":10,\"p\":1,\"t\":\"09:07:16:02\",\"x\":107.98611450195312,\"y\":270.44097900390625,\"oL\":8,\"oP\":1,\"text\":\"    fine to proceed with the presentations in the meantime.  \",\"width\":413.7153015136719,\"height\":20,\"identity\":\"24605227713000\"},{\"l\":11,\"p\":1,\"t\":\"09:07:19:04\",\"x\":107.98611450195312,\"y\":294.44097900390625,\"oL\":9,\"oP\":1,\"text\":\"    Could claimant''''s counsel plea\",\"width\":221.90972900390625,\"height\":20,\"identity\":\"24605273285100\"}]","cONote":"N:  Good morning, everybody.  This is Day 2 of \n    DIFC-LCIA matter 21381.  A couple of housekeeping \n    matters.  One of the claimant''s legal representatives is \n    not here, but I''ve just been told that the claimant is \n    fine to proceed with the presentations in the meantime.  \n    Could claimant''s counsel plea","newCordinates":"[{\"l\":6,\"p\":1,\"t\":\"09:06:05:07\",\"x\":174.39236450195312,\"y\":174.44094848632812,\"oL\":4,\"oP\":1,\"text\":\"CHAIRMAN:  Good morning, everybody.  This is Day 2 of \",\"width\":325.01739501953125,\"height\":20,\"identity\":24604945041400},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:06:58:20\",\"l\":7,\"p\":1,\"text\":\"    DIFC-LCIA matter 21381.  A couple of housekeeping \",\"oP\":1,\"oL\":5,\"identity\":24604945041401},{\"l\":8,\"p\":1,\"t\":\"09:07:06:22\",\"x\":107.98611450195312,\"y\":222.44094848632812,\"oL\":6,\"oP\":1,\"text\":\"    matters.  One of the claimant''s legal representatives is \",\"width\":398.1944580078125,\"height\":20,\"identity\":24605137128500},{\"l\":9,\"p\":1,\"t\":\"09:07:10:13\",\"x\":107.98611450195312,\"y\":246.44097900390625,\"oL\":7,\"oP\":1,\"text\":\"    not here, but I''ve just been told that the claimant is \",\"width\":375.2257080078125,\"height\":20,\"identity\":24605180005600},{\"l\":10,\"p\":1,\"t\":\"09:07:16:02\",\"x\":107.98611450195312,\"y\":270.44097900390625,\"oL\":8,\"oP\":1,\"text\":\"    fine to proceed with the presentations in the meantime.  \",\"width\":413.7153015136719,\"height\":20,\"identity\":24605227713000},{\"l\":11,\"p\":1,\"t\":\"09:07:19:04\",\"x\":107.98611450195312,\"y\":294.44097900390625,\"oL\":9,\"oP\":1,\"text\":\"    Could claimant''s counsel please Question interpreted) \",\"width\":221.90972900390625,\"height\":20,\"identity\":24605273285100}]","nRefresh":5,"jDCordinates":"[{\"l\":7,\"p\":1,\"t\":\"09:06:59:15\",\"x\":107.98611450195312,\"y\":198.44097900390625,\"oL\":5,\"oP\":1,\"text\":\"    DIFC-LCIA matter 21381.  A couple of housekeeping \",\"width\":377.482666015625,\"height\":20,\"identity\":\"24605087681800\"}]","firstPage":1}','r1');fetch all in "r1";

*/

	update "RIssueDetail" set "jOCordinates" = jCordinates WHERE "nIDid" = nIDid and "jOCordinates" is null;
	-- select * From realtime."RIssueDetailLog"
	insert into realtime."RIssueDetailLog"("nIDid","cONote","jCordinates","nRefresh","jDCordinates")
	values(nIDid,cONote,newCordinates,nRefresh,jDCordinates);

	update "RIssueDetail" set "jCordinates" = newCordinates,"cPageno" = firstPage where "nIDid" = nIDid;

	open ref for select 1 as msg,'Annotations updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
