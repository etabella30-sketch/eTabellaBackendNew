CREATE OR REPLACE FUNCTION transcript.et_get_theme_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare p_themeid uuid;
BEGIN
 -- select * from transcript.et_get_theme_detail ('{"cThemeid":"def529e1-0b59-406e-921f-111213d2241d"}','r1');fetch all in "r1";
	p_themeid := parameter->>'cThemeid';
	-- select * from transcript."Themes" order by 1 desc
    OPEN ref FOR
    SELECT "cThemeid", "cName", "nCFontid",ccm."cCodename" "cCFont", "nCFontsize", "bCIsCaps", "jCBold", "nBFont" ,bfont."cCodename" "cBFont", "nBFontsize", "nBLetterspacing", "nBLinespacing", "jBBold", "nPNFont",pfont."cCodename" "cPNFont", "nPNFontsize", "cPNPosition", "nPNStart", "bPNSwap", "nLFont",lfont."cCodename" "cLFont", "nLFontsize", "nTFont",tfont."cCodename" "cTFont", "nTFontsize", "nHFont",tfont."cCodename" "cHFont", "nHFontsize", "bHCover", "bHShow", "cPCaseName", "cPVolumeDate", "cPCompany", "cPCompanyInfo","bLNShow","bTShow","cPNAlignRL","cPNAlignTB","bIsdefault","bPInclude",
	"bLMbrand" -- ,"nLHeight","nBTHeight","nBFHeight","nAHeight"
    FROM transcript."Themes" t
	join "Codemaster" ccm on ccm."nCodeid" =  t."nCFontid"
	join "Codemaster" bfont on bfont."nCodeid" =  t."nBFont"
	join "Codemaster" pfont on pfont."nCodeid" =  t."nPNFont"
	join "Codemaster" lfont on lfont."nCodeid" =  t."nLFont"
	join "Codemaster" tfont on tfont."nCodeid" =  t."nTFont"
	join "Codemaster" hfont on hfont."nCodeid" =  t."nHFont"
    WHERE case when p_themeid is not null then "cThemeid" = p_themeid else "bIsdefault" = true end limit 1;
-- alter table transcript."Themes" add column "bPInclude" boolean default false
    RETURN ref;
END;
$function$
