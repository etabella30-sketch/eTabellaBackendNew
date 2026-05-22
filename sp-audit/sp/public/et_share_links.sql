CREATE OR REPLACE FUNCTION public.et_share_links(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;
jUsers jsonb;nId uuid;cType text;
jNotify jsonb;nCaseid uuid;
nPMid int;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jUsers := parameter ->>'jUsers';
nId := NULLIF(parameter ->>'nId','')::uuid;
cType := parameter ->>'cType';

-- select * from et_share_links('{""nId"":1,""cType"":""F"",""jUsers"":[1,2,3],""nMasterid"":2}','r');fetch all in ""r""

    
if(cType = 'F') then

    if exists(select * from "FactMaster" where "nFSid" = nId and "nUserid" = nMasterid) then

nCaseid := (select "nCaseid" from "FactMaster" where "nFSid" = nId);

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

/*
    with location as (
        
        select nMasterid as ""nMasterid"",nId as ""nFSid"",i.""value""::int  as ""nUserid""
        from jsonb_array_elements(jUsers)  AS i(value)  where i.value::int not in (select ""nUserid"" from ""FMShared"" where ""nFSid"" = nId)
        
    ),tbl as (select u.""nUserid"",'Fact shared' as ""cTitle"",
        cr.""cFname"" || ' ' || cr.""cLname""  || ' has shared fact with you' as ""cMsg"",
        s.""nFSid"",u.""cToken"",'FS' as ""cType"",nCaseid as ""nCaseid""
        
        from ""UserMaster"" u
        join location s on s.""nUserid"" = u.""nUserid""
    
        join ""UserMaster"" cr on cr.""nUserid"" = s.""nMasterid""
        where  nullif(u.""cToken"",'') is not null
        ) select jsonb_agg(t) into jNotify from tbl t;

    
    delete from ""FMShared"" where ""nFSid"" = nId;
    insert into ""FMShared""(""nFSid"",""nUserid"")
    select nId,i.""value""::int from jsonb_array_elements(jUsers)  AS i(value);
*/

WITH inserted_users AS (
    -- Insert new records and return the inserted user IDs
    INSERT INTO "FMShared"("nFSid", "nUserid")
    SELECT nId, i.value::uuid 
    FROM jsonb_array_elements_text(jUsers) AS i(value)
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "FMShared" 
        WHERE "nFSid" = nId 
        AND "nUserid" = i.value::uuid
    )
    RETURNING "nUserid"
),
-- First perform the delete
deleted AS (
    DELETE FROM "FMShared" 
    WHERE "nFSid" = nId 
    AND "nUserid" NOT IN (
        SELECT value::uuid 
        FROM jsonb_array_elements_text(jUsers) AS i(value)
    )
),
-- Only get notifications for newly inserted users
notification_data AS (
    SELECT 
        u."nUserid",
        'Fact shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared fact with you' as "cMsg",
        nId as "nFSid",
        u."cToken",
        'FS' as "cType",
        nCaseid as "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr ON cr."nUserid" = nMasterid
	left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
	WHERE
	 --nullif(u."cToken",'') IS NOT NULL
	 coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 	
)
SELECT jsonb_agg(t) INTO jNotify 
FROM notification_data t;

    open ref for 
select 1 as msg,jNotify "jNotify";
    
    else 

        open ref for select -1 as msg,'No permited' as value;

    end if;

elsif(cType = 'D')then

    -- select * From ""DMShared""
    
    if exists(select * from "DocMaster" where "nDocid" = nId and "nUserid" = nMasterid) then

nCaseid := (select "nCaseid" from "DocMaster" where "nDocid" = nId);

/*

with location as (
        
        select nMasterid as ""nMasterid"",nId as ""nDocid"",i.""value""::int  as ""nUserid""
        from jsonb_array_elements(jUsers)  AS i(value)  where i.value::int not in (select ""nUserid"" from ""DMShared"" where ""nDocid"" = nId)
        
    ),tbl as (select u.""nUserid"",'Doclink shared' as ""cTitle"",
        cr.""cFname"" || ' ' || cr.""cLname""  || ' has shared doclink with you' as ""cMsg"",
        s.""nDocid"",u.""cToken"",'DS' as ""cType"",nCaseid as ""nCaseid""
        
        from ""UserMaster"" u
        join location s on s.""nUserid"" = u.""nUserid""
    
        join ""UserMaster"" cr on cr.""nUserid"" = s.""nMasterid""
        where  nullif(u.""cToken"",'') is not null
        ) select jsonb_agg(t) into jNotify from tbl t;
    
    delete from ""DMShared"" where ""nDocid"" = nId;
    insert into ""DMShared""(""nDocid"",""nUserid"")
    select nId,i.""value""::int from jsonb_array_elements(jUsers)  AS i(value);
*/

WITH inserted_users AS (
    -- Insert new records and return the inserted user IDs
    INSERT INTO "DMShared"("nDocid", "nUserid")
    SELECT nId, i.value::uuid 
    FROM jsonb_array_elements_text(jUsers) AS i(value)
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "DMShared" 
        WHERE "nDocid" = nId 
        AND "nUserid" = i.value::uuid
    )
    RETURNING "nUserid"
),
-- First perform the delete
deleted AS (
    DELETE FROM "DMShared" 
    WHERE "nDocid" = nId 
    AND "nUserid" NOT IN (
        SELECT value::uuid 
        FROM jsonb_array_elements_text(jUsers) AS i(value)
    )
),
-- Only get notifications for newly inserted users
notification_data AS (
    SELECT 
        u."nUserid",
        'Doclink shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared Doclink with you' as "cMsg",
        nId as "nDocid",
        u."cToken",
        'DS' as "cType",
        nCaseid as "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr ON cr."nUserid" = nMasterid
	left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
	WHERE
	--nullif(u."cToken",'') IS NOT NULL
	coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 

	
)
SELECT jsonb_agg(t) INTO jNotify 
FROM notification_data t;

    open ref for 
select 1 as msg,jNotify "jNotify";
    
    else 

        open ref for select -1 as msg,'No permited' as value;

    end if;

elsif(cType = 'W')then

    

    -- select * From ""WMShared""

    if exists(select * from "WebMaster" where "nWebid" = nId and "nUserid" = nMasterid)then

nCaseid := (select "nCaseid" from "WebMaster" where "nWebid" = nId);

/*    with location as (
        
        select nMasterid as ""nMasterid"",nId as ""nWebid"",i.""value""::int  as ""nUserid""
        from jsonb_array_elements(jUsers)  AS i(value)  where i.value::int not in (select ""nUserid"" from ""WMShared"" where ""nWebid"" = nId)
        
    ),tbl as (select u.""nUserid"",'Weblink shared' as ""cTitle"",
        cr.""cFname"" || ' ' || cr.""cLname""  || ' has shared weblink with you' as ""cMsg"",
        s.""nWebid"",u.""cToken"",'WS' as ""cType"",nCaseid as ""nCaseid""
        
        from ""UserMaster"" u
        join location s on s.""nUserid"" = u.""nUserid""
    
        join ""UserMaster"" cr on cr.""nUserid"" = s.""nMasterid""
        where  nullif(u.""cToken"",'') is not null
        ) select jsonb_agg(t) into jNotify from tbl t;
    
    delete from ""WMShared"" where ""nWebid"" = nId;
    insert into ""WMShared""(""nWebid"",""nUserid"")
    select nId,i.""value""::int from jsonb_array_elements(jUsers)  AS i(value);
*/

WITH inserted_users AS (
    -- Insert new records and return the inserted user IDs
    INSERT INTO "WMShared"("nWebid", "nUserid")
    SELECT nId, i.value::uuid 
    FROM jsonb_array_elements_text(jUsers) AS i(value)
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "WMShared" 
        WHERE "nWebid" = nId 
        AND "nUserid" = i.value::uuid
    )
    RETURNING "nUserid"
),
-- First perform the delete
deleted AS (
    DELETE FROM "WMShared" 
    WHERE "nWebid" = nId 
    AND "nUserid" NOT IN (
        SELECT value::uuid 
        FROM jsonb_array_elements_text(jUsers) AS i(value)
    )
),
-- Only get notifications for newly inserted users
notification_data AS (
    SELECT 
        u."nUserid",
        'weblink shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared weblink with you' as "cMsg",
        nId as "nWebid",
        u."cToken",
        'DS' as "cType",
        nCaseid as "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr ON cr."nUserid" = nMasterid
	left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
	 WHERE
	 -- nullif(u."cToken",'') IS NOT NULL
	 coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 
	
)
SELECT jsonb_agg(t) INTO jNotify 
FROM notification_data t;

    open ref for 
select 1 as msg,jNotify "jNotify";
    
    else 

        open ref for select -1 as msg,'No permited' as value;

    end if;

end if;

    RETURN ref;
END;
$function$
