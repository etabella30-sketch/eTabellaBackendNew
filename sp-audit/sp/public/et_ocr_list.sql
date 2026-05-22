CREATE OR REPLACE FUNCTION public.et_ocr_list(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;
BEGIN
	nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

	-- select * from et_ocr_list('{}','r');fetch all in ""r""
open ref1 for
		select c."nCaseid","cCasename","cCaseno" from "OCRLog" ol
		join "CaseMaster" c on c."nCaseid" = ol."nCaseid"
		 where ol."cStatus" not in ('C','F')
		group by c."nCaseid","cCasename","cCaseno";

		
	RETURN next ref1;
-- select * from ""UserMaster""
	open ref2 for
		select u."nUserid","cFname" ,"cLname","cProfile" from "OCRLog" ol
		join "UserMaster" u on u."nUserid" = ol."nUserid"	where ol."cStatus"  not in ('C','F')
		group by u."nUserid","cFname" ,"cLname","cProfile" ;
		
	RETURN next ref2;

	
	END;
$function$
