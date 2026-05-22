CREATE OR REPLACE FUNCTION transcript.et_theme_builder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Common fields
    c_name text;
    n_cfontid INT;
    n_cfontsize INT;
    b_ciscaps BOOLEAN;
    j_cbold JSONB;
    n_bfont INT;
    n_bfontsize INT;
    n_bletterspacing double precision;
    n_blinespacing INT;
    j_bbold JSONB;
    n_pnfont INT;
    n_pnfontsize INT;
    c_pnposition text;
    n_pnstart INT;
    b_pnswap BOOLEAN;
    n_lfont INT;
    n_lfontsize INT;
    n_tfont INT;
    n_tfontsize INT;
    n_hfont INT;
    n_hfontsize INT;
    b_hcover BOOLEAN;
    b_hshow BOOLEAN;
    c_pcasename text;
    c_pvolumedate text;
    c_pcompany text;
    c_pcompanyinfo text;
    n_userid INT;

    inserted_id UUID;
    c_themeid UUID;
	bIsdefault boolean;
    op_type TEXT := parameter ->> 'permission';
	bLNShow boolean;bTShow boolean;

    msg INT := 1;
    msg_text TEXT := '';
	c_PNAlignRL text;
	c_PNAlignTB text;
	bPInclude boolean;
	-- nAHeight double precision;
	-- nBFHeight double precision;
	-- nBTHeight double precision;
	-- nLHeight double precision;
	bLMbrand boolean;
BEGIN
    -- Extract common fields
    c_name := trim(parameter ->> 'cName');
    n_cfontid := (parameter ->> 'nCFontid')::INT;
    n_cfontsize := (parameter ->> 'nCFontsize')::INT;
    b_ciscaps := (parameter ->> 'bCIsCaps')::BOOLEAN;
    j_cbold := parameter ->> 'jCBold';
    n_bfont := (parameter ->> 'nBFont')::INT;
    n_bfontsize := (parameter ->> 'nBFontsize')::INT;
    n_bletterspacing := (parameter ->> 'nBLetterspacing')::double precision;
    n_blinespacing := (parameter ->> 'nBLinespacing')::INT;
    j_bbold := parameter ->> 'jBBold';
    n_pnfont := (parameter ->> 'nPNFont')::INT;
    n_pnfontsize := (parameter ->> 'nPNFontsize')::INT;
    c_pnposition := (parameter ->> 'cPNPosition');
    n_pnstart := (parameter ->> 'nPNStart')::INT;
    b_pnswap := COALESCE((parameter ->> 'bPNSwap')::BOOLEAN, FALSE);
    n_lfont := (parameter ->> 'nLFont')::INT;
    n_lfontsize := (parameter ->> 'nLFontsize')::INT;
    n_tfont := (parameter ->> 'nTFont')::INT;
    n_tfontsize := (parameter ->> 'nTFontsize')::INT;
    n_hfont := (parameter ->> 'nHFont')::INT;
    n_hfontsize := (parameter ->> 'nHFontsize')::INT;
    b_hcover := (parameter ->> 'bHCover')::BOOLEAN;
    b_hshow := (parameter ->> 'bHShow')::BOOLEAN;
    c_pcasename := (parameter ->> 'cPCaseName');
    c_pvolumedate := (parameter ->> 'cPVolumeDate');
    c_pcompany := (parameter ->> 'cPCompany');
    c_pcompanyinfo := (parameter ->> 'cPCompanyInfo');
	bTShow := (parameter ->> 'bTShow')::BOOLEAN;
	bLNShow := (parameter ->> 'bLNShow')::BOOLEAN;
    n_userid := (parameter ->> 'nUserid')::INT;
	c_PNAlignRL:= (parameter ->> 'cPNAlignRL');
	c_PNAlignTB:= (parameter ->> 'cPNAlignTB');
	bPInclude:= (parameter ->> 'bPInclude');
	-- nAHeight:= (parameter ->> 'nAHeight');
	-- nBFHeight:= (parameter ->> 'nBFHeight');
	-- nBTHeight:= (parameter ->> 'nBTHeight');
	-- nLHeight:= (parameter ->> 'nLHeight');
	 bLMbrand:= (parameter ->> 'bLMbrand');

	if parameter->>'bIsdefault' is not null then 
		bIsdefault := (parameter->>'bIsdefault')::boolean;
	end if;
	IF (op_type = 'I' or op_type = 'U') AND bIsdefault = true THEN
			update transcript."Themes" set "bIsdefault" = false;
	END IF;

    IF op_type = 'N' THEN

		IF EXISTS (
		    SELECT 1 FROM transcript."Themes" WHERE LOWER("cName") = LOWER(c_name)
		) THEN
		    msg := -1;
		    msg_text := 'Theme name already exists.';
		    OPEN ref FOR SELECT msg AS msg, msg_text AS message, NULL::UUID AS inserted_id;
		    RETURN ref;
		END IF;
		
        INSERT INTO transcript."Themes" (
            "cName", "nCFontid", "nCFontsize", "bCIsCaps", "jCBold", "nBFont", "nBFontsize", 
            "nBLetterspacing", "nBLinespacing", "jBBold", "nPNFont", "nPNFontsize", 
            "cPNPosition", "nPNStart", "bPNSwap", "nLFont", "nLFontsize", "nTFont", 
            "nTFontsize", "nHFont", "nHFontsize", "bHCover", "bHShow", "cPCaseName", 
            "cPVolumeDate", "cPCompany", "cPCompanyInfo", "nUserid", "dCreateDt","bIsdefault","bLNShow","bTShow",
			"cPNAlignRL","cPNAlignTB","bPInclude", -- "nLHeight","nBTHeight","nBFHeight","nAHeight",
			"bLMbrand"
        )
        VALUES (
            c_name, n_cfontid, n_cfontsize, b_ciscaps, j_cbold::jsonb, n_bfont, n_bfontsize,
            n_bletterspacing, n_blinespacing, j_bbold::jsonb, n_pnfont, n_pnfontsize,
            c_pnposition, n_pnstart, b_pnswap, n_lfont, n_lfontsize, n_tfont,
            n_tfontsize, n_hfont, n_hfontsize, b_hcover, b_hshow, c_pcasename,
            c_pvolumedate, c_pcompany, c_pcompanyinfo, n_userid, NOW(),coalesce(bIsdefault,false),bLNShow,bTShow
			,c_PNAlignRL,c_PNAlignTB,coalesce(bPInclude,false), --coalesce(nLHeight,1),coalesce(nBTHeight,1),coalesce(nBFHeight,1),coalesce(nAHeight,1),
			bLMbrand
        )
        RETURNING "cThemeid" INTO inserted_id;

        msg_text := 'Theme Inserted';

    ELSIF op_type = 'U' THEN
        c_themeid := (parameter ->> 'cThemeid')::UUID;

		IF EXISTS (
		    SELECT 1 FROM transcript."Themes"  WHERE LOWER("cName") = LOWER(c_name) AND "cThemeid" <> c_themeid
		) THEN
		    msg := -1;
		    msg_text := 'Theme name already exists.';
		    OPEN ref FOR SELECT msg AS msg, msg_text AS message, NULL::UUID AS inserted_id;
		    RETURN ref;
		END IF;

        UPDATE transcript."Themes"
        SET 
            "cName" = c_name,
            "nCFontid" = n_cfontid,
            "nCFontsize" = n_cfontsize,
            "bCIsCaps" = b_ciscaps,
            "jCBold" = j_cbold::jsonb,
            "nBFont" = n_bfont,
            "nBFontsize" = n_bfontsize,
            "nBLetterspacing" = n_bletterspacing,
            "nBLinespacing" = n_blinespacing,
            "jBBold" = j_bbold::jsonb,
            "nPNFont" = n_pnfont,
            "nPNFontsize" = n_pnfontsize,
            "cPNPosition" = c_pnposition,
            "nPNStart" = n_pnstart,
            "bPNSwap" = b_pnswap,
            "nLFont" = n_lfont,
            "nLFontsize" = n_lfontsize,
            "nTFont" = n_tfont,
            "nTFontsize" = n_tfontsize,
            "nHFont" = n_hfont,
            "nHFontsize" = n_hfontsize,
            "bHCover" = b_hcover,
            "bHShow" = b_hshow,
            "cPCaseName" = c_pcasename,
            "cPVolumeDate" = c_pvolumedate,
            "cPCompany" = c_pcompany,
            "cPCompanyInfo" = c_pcompanyinfo,
			"bIsdefault" =coalesce(bIsdefault,false),
            "dUpdateDt" = NOW(),"bLNShow" = bLNShow,"bTShow" =bTShow,
			"cPNAlignRL" =c_PNAlignRL,
			"cPNAlignTB" = c_PNAlignTB,"bPInclude" = coalesce(bPInclude,false),
			-- "nLHeight" = nLHeight,"nBTHeight" = nBTHeight,"nBFHeight" = nBFHeight,"nAHeight"= nAHeight,
			"bLMbrand" = bLMbrand
        WHERE "cThemeid" = c_themeid;

        inserted_id := c_themeid;
        msg_text := 'Theme Updated';

    ELSIF op_type = 'D' THEN
        c_themeid := (parameter ->> 'cThemeid')::UUID;

        BEGIN
            DELETE FROM transcript."Themes"
            WHERE "cThemeid" = c_themeid;

            inserted_id := c_themeid;
            msg_text := 'Theme Deleted';
        EXCEPTION
            WHEN foreign_key_violation THEN
                msg := -1;
                msg_text := 'Cannot delete theme. It is being referenced.';
                OPEN ref FOR SELECT msg AS msg, msg_text AS message, NULL::UUID AS inserted_id;
                RETURN ref;
            WHEN OTHERS THEN
                msg := -1;
                msg_text := 'Error deleting theme: ' || SQLERRM;
                OPEN ref FOR SELECT msg AS msg, msg_text AS message, NULL::UUID AS inserted_id;
                RETURN ref;
        END;

    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    OPEN ref FOR SELECT msg, msg_text AS value, inserted_id;
    RETURN ref;
END;
$function$
