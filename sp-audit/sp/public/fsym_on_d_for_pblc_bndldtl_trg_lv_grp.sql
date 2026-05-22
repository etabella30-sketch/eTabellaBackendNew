CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_bndldtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'BundleDetail',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      279,                                                                                                                                             
                                      
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTab" is null then '' else '"' || replace(replace(cast(old."cTab" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cExhibitno" is null then '' else '"' || replace(replace(cast(old."cExhibitno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFilename" is null then '' else '"' || replace(replace(cast(old."cFilename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPath" is null then '' else '"' || replace(replace(cast(old."cPath" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIsindex" is null then '' when old."cIsindex" then '"1"' else '"0"' end||','||
          case when old."cPage" is null then '' else '"' || replace(replace(cast(old."cPage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFilesize" is null then '' else '"' || replace(replace(cast(old."cFilesize" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFiletype" is null then '' else '"' || replace(replace(cast(old."cFiletype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cRefpage" is null then '' else '"' || replace(replace(cast(old."cRefpage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dIntrestDt" is null then '' else '"' || replace(replace(cast(old."dIntrestDt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDesc" is null then '' else '"' || replace(replace(cast(old."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nOBundledetailid" is null then '' else '"' || cast(cast(old."nOBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."sorted_tab" is null then '' else '"' || replace(replace(cast(old."sorted_tab" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_name" is null then '' else '"' || replace(replace(cast(old."sorted_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_page" is null then '' else '"' || replace(replace(cast(old."sorted_page" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_refpage" is null then '' else '"' || replace(replace(cast(old."sorted_refpage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_exhibitno" is null then '' else '"' || replace(replace(cast(old."sorted_exhibitno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_description" is null then '' else '"' || replace(replace(cast(old."sorted_description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_intrestdt" is null then '' else '"' || replace(replace(cast(old."sorted_intrestdt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."end_date" is null then '' when isfinite(old."end_date") then '"' || to_char(old."end_date", 'YYYY-MM-DD HH24:MI:SS') || '"' else '' end||','||
          case when old."start_date" is null then '' when isfinite(old."start_date") then '"' || to_char(old."start_date", 'YYYY-MM-DD HH24:MI:SS') || '"' else '' end||','||
          case when old."cAuthor" is null then '' else '"' || replace(replace(cast(old."cAuthor" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_author" is null then '' else '"' || replace(replace(cast(old."sorted_author" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_filename" is null then '' else '"' || replace(replace(cast(old."tsv_filename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_tab" is null then '' else '"' || replace(replace(cast(old."tsv_tab" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_desc" is null then '' else '"' || replace(replace(cast(old."tsv_desc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_exhibit" is null then '' else '"' || replace(replace(cast(old."tsv_exhibit" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_author" is null then '' else '"' || replace(replace(cast(old."tsv_author" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPrefix" is null then '' else '"' || replace(replace(cast(old."cPrefix" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundleid" is null then '' else '"' || replace(replace(cast(old."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nSectionid" is null then '' else '"' || replace(replace(cast(old."nSectionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCreateId" is null then '' else '"' || replace(replace(cast(old."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUpdateId" is null then '' else '"' || replace(replace(cast(old."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnBundleid" is null then '' else '"' || cast(cast(old."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCreateId" is null then '' else '"' || cast(cast(old."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when old."ZnSectionid" is null then '' else '"' || cast(cast(old."ZnSectionid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUpdateId" is null then '' else '"' || cast(cast(old."ZnUpdateId" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_bundledetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
