CREATE OR REPLACE FUNCTION helpcenter.et_help_insert_feedback(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;
	nFaqid uuid;
	bIsHelpful boolean;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nFaqid := NULLIF(parameter ->>'nFaqid','')::uuid;
bIsHelpful := parameter ->>'bIsHelpful';

/*  

select * from helpcenter.et_help_insert_feedback('{""nFaqid"": 1, ""nMasterid"": 464, ""bIsHelpful"": true}','r');fetch all in ""r""

select * from helpcenter."FaqFeedback"
*/

insert into helpcenter."FaqFeedback"("nFaqid","nUserid","bIsHelpful")
values(nFaqid, nMasterid, bIsHelpful);

open ref for
	select 1 as msg,'inserted' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
