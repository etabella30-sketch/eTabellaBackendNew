CREATE OR REPLACE FUNCTION public.et_upload_checkduplicacy(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid; nSectionid uuid; nBundleid uuid; d jsonb; rec RECORD; x record;
    new_id UUID; nMainbundleid uuid; nExistsid uuid;
    jRecord jsonb; nUPid uuid; cUnicid text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nMainbundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nUPid :=  NULLIF(parameter ->>'nUPid','')::uuid;
d := parameter ->>'d';

/*

 select * from public.et_upload_checkduplicacy ('{"nCaseid":"98333428-14ac-45de-ac2a-474ba25c2705","nSectionid":"0d1745de-54ab-4adf-988d-6b9eedc41324","nBundleid":null,"d":"[[1,0,\"A1-Claimant s notice of arbitration - Copy (3).PDF\",false,null,null,\"30811028\",\"PDF\"]]","nUPid":null,"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

select * from public.et_upload_checkduplicacy ('{"nCaseid":"98333428-14ac-45de-ac2a-474ba25c2705","nSectionid":"0d1745de-54ab-4adf-988d-6b9eedc41324","nBundleid":null,"d":"[[1,0,\"C4 R-0015\",true,null,null,null,null],[2,1,\"Attachment\",true,null,null,null,null],[3,2,\"Appendix M-design drawings of marine - 빈폴더(Confirmed by 상대방) C4.1.3\",true,null,null,null,null],[5,2,\"Appendix M_빈 폴더 C4.1.4\",true,null,null,null,null],[7,1,\"Annex 4 HSE Management Agreement.pdf\",false,null,null,\"459573\",\"PDF\"],[8,1,\"Conditions of contract.doc\",false,null,null,\"1034240\",\"DOC\"],[9,1,\"Conditions of contract.pdf\",false,null,null,\"1107985\",\"PDF\"],[10,1,\"Technical Requirement.docx\",false,null,null,\"74496\",\"DOCX\"],[11,1,\"Technical Requirement.pdf\",false,null,null,\"316867\",\"PDF\"],[12,1,\"Technical Specification.docx\",false,null,null,\"1824886\",\"DOCX\"],[13,1,\"Technical Specification.pdf\",false,null,null,\"544398\",\"PDF\"],[14,2,\"Appendix A-Owner''s Technical Specifications.docx\",false,null,null,\"32591\",\"DOCX\"],[15,2,\"Appendix A-Owner''s Technical Specifications.pdf\",false,null,null,\"118441\",\"PDF\"],[16,2,\"Appendix A.docx\",false,null,null,\"32592\",\"DOCX\"],[17,2,\"Appendix A.pdf\",false,null,null,\"113491\",\"PDF\"],[18,2,\"Appendix B-SPECIFICATIONS FOR MARINE WORK.docx\",false,null,null,\"1824953\",\"DOCX\"],[19,2,\"Appendix B-SPECIFICATIONS FOR MARINE WORK.pdf\",false,null,null,\"548129\",\"PDF\"],[20,2,\"Appendix B.docx\",false,null,null,\"1824951\",\"DOCX\"],[21,2,\"Appendix C- Supply Chain Requirements for the subcontractor.docx\",false,null,null,\"41888\",\"DOCX\"],[22,2,\"Appendix C.docx\",false,null,null,\"41887\",\"DOCX\"],[23,2,\"Appendix D -Packing, Storage and Transportation Plan.docx\",false,null,null,\"2721282\",\"DOCX\"],[24,2,\"Appendix D -Packing, Storage and Transportation Plan.pdf\",false,null,null,\"1451856\",\"PDF\"],[25,2,\"Appendix D.docx\",false,null,null,\"2721284\",\"DOCX\"],[26,2,\"Appendix D.pdf\",false,null,null,\"1432657\",\"PDF\"],[27,2,\"Appendix E-HSE Management Agreement .docx\",false,null,null,\"88876\",\"DOCX\"],[28,2,\"Appendix E-HSE Management Agreement.pdf\",false,null,null,\"465691\",\"PDF\"],[29,2,\"Appendix E.docx\",false,null,null,\"88872\",\"DOCX\"],[30,2,\"Appendix E.pdf\",false,null,null,\"458406\",\"PDF\"],[31,2,\"Appendix F-Specified Quality Requirements .doc\",false,null,null,\"59392\",\"DOC\"],[32,2,\"Appendix F.doc\",false,null,null,\"59392\",\"DOC\"],[33,2,\"Appendix G-The Quality Requirement for Equipment Bidding.doc\",false,null,null,\"57856\",\"DOC\"],[34,2,\"Appendix G.doc\",false,null,null,\"57856\",\"DOC\"],[35,2,\"Appendix G.pdf\",false,null,null,\"80454\",\"PDF\"],[36,2,\"Appendix H-PROJECT COMMUNICATION PROCEDURE.doc\",false,null,null,\"157855\",\"DOC\"],[37,2,\"Appendix H-PROJECT COMMUNICATION PROCEDURE.pdf\",false,null,null,\"269762\",\"PDF\"],[38,2,\"Appendix H.pdf\",false,null,null,\"264398\",\"PDF\"],[39,2,\"Appendix J.pdf\",false,null,null,\"306916\",\"PDF\"],[40,2,\"Appendix K-Require Document for Approva -Permit.pdf\",false,null,null,\"61668\",\"PDF\"],[41,2,\"Appendix K.pdf\",false,null,null,\"61672\",\"PDF\"],[42,2,\"Appendix L.pdf\",false,null,null,\"11994746\",\"PDF\"],[43,2,\"Appendix N-General Layout of Temporary Facilities.pdf\",false,null,null,\"670092\",\"PDF\"],[44,2,\"Appendix N.pdf\",false,null,null,\"670089\",\"PDF\"],[45,1,\"MASTER1\",true,null,null,null,null],[46,45,\"Technical Specification.pdf\",false,null,null,\"544398\",\"PDF\"],[47,2,\"Appendix I-Geological survey report C4.1.2\",true,null,null,null,null],[48,47,\"19490-~1.DWG\",false,null,null,\"25017792\",\"DWG\"],[49,47,\"19490-~1.PDF\",false,null,null,\"5014564\",\"PDF\"],[50,47,\"19490-~2.PDF\",false,null,null,\"3615914\",\"PDF\"],[51,47,\"19490-~3.PDF\",false,null,null,\"3580750\",\"PDF\"],[52,47,\"19490-~4.PDF\",false,null,null,\"3663682\",\"PDF\"],[53,47,\"198C0B~1.PDF\",false,null,null,\"4229531\",\"PDF\"],[54,47,\"Control Point Location.dwg\",false,null,null,\"5481081\",\"DWG\"],[55,47,\"Control Point Location.pdf\",false,null,null,\"892494\",\"PDF\"],[56,47,\"UAQ-C2-W0-CGG-0000-UE-WZZ-001 A.pdf\",false,null,null,\"21016816\",\"PDF\"],[57,47,\"UAQ-C2-W0-CGG-0000-UE-WZZ-002 A.pdf\",false,null,null,\"7032521\",\"PDF\"],[58,47,\"UAQ-C2-W0-CGG-0000-UE-WZZ-004 A.pdf\",false,null,null,\"2340251\",\"PDF\"]]","nUPid":null,"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

 
 select * from "UploadDetail"
*/

/*

0 id
1 parentid
2 name
3 isFolder
4 nBundleid
5 nParentBundleid
6 size
7 type

select * from temp_folders
*/

if(nUPid IS NULL)then

insert into "UploadMaster" ("nCaseid","nBundleid","nSectionid","nUserid","dCreateDt")
values (nCaseid,nBundleid,nSectionid,nMasterid,now())
RETURNING "nUPid" into nUPid;

end if;

drop table if exists temp_folders;
create temp table temp_folders as 
select (ar->>0)::int "id",
case when (ar->>1)::int = 0 then nBundleid::text else (ar->>1)::text end as "parentid",(ar->>2)::text "name",
(ar->>3)::boolean "isFolder",
-- (ar->>4)::uuid "nBundleid",
CASE 
	WHEN (ar->>4) IS NULL OR ar->>4 IN ('0', '') THEN NULL::uuid
	ELSE (ar->>4)::uuid
	END AS "nBundleid",
(ar->>5)::uuid as "nParentBundleid",
(ar->>6)::text as "size",(ar->>7)::text as "filetype",null::uuid "nBundledetailid",null "nUDid"
from jsonb_array_elements(d) as ar(elm);

    FOR rec IN SELECT * FROM temp_folders where "isFolder" = true -- jsonb_array_elements(jFolders)
     LOOP
     
     
     select * into x from "temp_folders" t where t.id = rec.id;
     
     
     nExistsid := null::uuid;
    
     nBundleid := COALESCE(
                 NULLIF(x."nBundleid", null::uuid),
                 COALESCE(
                     NULLIF(x."nParentBundleid", null::uuid),
                     null::uuid
                 ),
                 null
             );
    

     
    nExistsid := (select "nBundleid" from "BundleMaster" where "nSectionid" = nSectionid and "nParentBundleid" is not distinct from nBundleid and trim(upper("cBundlename")) = trim(upper(x.name)) );
     
     if nExistsid IS NULL then
     
        insert into "BundleMaster"("cBundlename","nParentBundleid","nSectionid","nCreateId","dCreateDt")
        values(x.name,nBundleid,nSectionid,nMasterid,now())
        returning "nBundleid" into nExistsid;
                 
        
     end if;
     
    update temp_folders set "nBundleid" = nExistsid where "id" = x.id;
     
    update temp_folders set "nBundleid" = nExistsid where "parentid" = x.id::text and "isFolder" = false;
    
    update temp_folders set "nParentBundleid" = nExistsid where "parentid" = x.id::text;
     
    
        
    END LOOP;

update "temp_folders" t 
set "nBundleid" = nMainbundleid
where t."parentid" IS NULL;

update "temp_folders" t1 set "nBundledetailid" = t."nBundledetailid" 
from "BundleDetail" t 
where t1."isFolder" = false and t."nBundleid" is not distinct from COALESCE(NULLIF(t1."nBundleid",null::uuid),nMainbundleid) and t."nSectionid" = nSectionid and t."cFilename" = t1.name;

-- select * From "BundleDetail" order by "dCreateDt" desc
-- select * from "temp_folders" t1

/*

if(coalesce(nUPid,0)>0)then
    insert into ""UploadDetail"" (""nUPid"",""cUnicid"",""cName"",""cStatus"",""cSize"",""cType"",""dCreateDt"")
    select nUPid,id,name,'P',t.""size"",t.""filetype"",now() from temp_folders t ;
end if;*/
-- select * from ""UploadDetail""

/* WITH inserted_details AS (
        INSERT INTO ""UploadDetail"" (""nUPid"", ""cUnicid"", ""cName"", ""cStatus"", ""cSize"", ""cType"", ""dCreateDt"")
        SELECT nUPid, id, name, 'P', t.""size"", t.""filetype"", NOW()
        FROM temp_folders t
        WHERE t.""isFolder"" = FALSE
        RETURNING ""nUDid"", ""cUnicid""
    )
    UPDATE temp_folders tf
    SET ""nUDid"" = id.""nUDid""
    FROM inserted_details id
    WHERE tf.id::text = id.""cUnicid"";*/
    
WITH inserted_details AS (
    INSERT INTO "UploadDetail" ("nUPid", "cUnicid", "cName", "cSize", "cType", "dCreateDt")
    SELECT nUPid, id, name, t."size", t."filetype", NOW()
    FROM temp_folders t
    WHERE t."isFolder" = FALSE
    RETURNING "nUDid", "cUnicid", "nUPid"
),
updated_folders AS (
    UPDATE temp_folders tf
    SET "nUDid" = id."nUDid"
    FROM inserted_details id
    WHERE tf.id::text = id."cUnicid"
    RETURNING id."nUPid"
),
count_inserted AS (
    SELECT "nUPid", COUNT(*) as inserted_count
    FROM inserted_details
    GROUP BY "nUPid"
)
UPDATE "UploadMaster" um
SET "nTotal" = coalesce(um."nTotal",0) + ci.inserted_count
FROM count_inserted ci
WHERE um."nUPid" = ci."nUPid";

cUnicid := (select "nUPid" || to_char("dCreateDt",'_yyyy_mm_dd') from "UploadMaster" where "nUPid" = nUPid);

open ref for

SELECT 1 as msg,nUPid as "nUPid",cUnicid as "cUnicid",jsonb_agg(ARRAY[id::text,"nBundleid"::text,"nUDid"::text] || 
       CASE 
           WHEN "nBundledetailid" is not null THEN ARRAY["nBundledetailid"::text] 
           ELSE ARRAY[]::text[]
       END) AS "jResult"
FROM temp_folders t
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
