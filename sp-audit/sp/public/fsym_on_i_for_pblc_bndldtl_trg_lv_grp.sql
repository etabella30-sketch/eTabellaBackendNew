CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_bndldtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'BundleDetail',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      279,                                                                                                                                             
                                      
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTab" is null then '' else '"' || replace(replace(cast(new."cTab" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cExhibitno" is null then '' else '"' || replace(replace(cast(new."cExhibitno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFilename" is null then '' else '"' || replace(replace(cast(new."cFilename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cPath" is null then '' else '"' || replace(replace(cast(new."cPath" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cIsindex" is null then '' when new."cIsindex" then '"1"' else '"0"' end||','||
          case when new."cPage" is null then '' else '"' || replace(replace(cast(new."cPage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFilesize" is null then '' else '"' || replace(replace(cast(new."cFilesize" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFiletype" is null then '' else '"' || replace(replace(cast(new."cFiletype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cRefpage" is null then '' else '"' || replace(replace(cast(new."cRefpage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dIntrestDt" is null then '' else '"' || replace(replace(cast(new."dIntrestDt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDesc" is null then '' else '"' || replace(replace(cast(new."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nOBundledetailid" is null then '' else '"' || cast(cast(new."nOBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."sorted_tab" is null then '' else '"' || replace(replace(cast(new."sorted_tab" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_name" is null then '' else '"' || replace(replace(cast(new."sorted_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_page" is null then '' else '"' || replace(replace(cast(new."sorted_page" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_refpage" is null then '' else '"' || replace(replace(cast(new."sorted_refpage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_exhibitno" is null then '' else '"' || replace(replace(cast(new."sorted_exhibitno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_description" is null then '' else '"' || replace(replace(cast(new."sorted_description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_intrestdt" is null then '' else '"' || replace(replace(cast(new."sorted_intrestdt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."end_date" is null then '' when isfinite(new."end_date") then '"' || to_char(new."end_date", 'YYYY-MM-DD HH24:MI:SS') || '"' else '' end||','||
          case when new."start_date" is null then '' when isfinite(new."start_date") then '"' || to_char(new."start_date", 'YYYY-MM-DD HH24:MI:SS') || '"' else '' end||','||
          case when new."cAuthor" is null then '' else '"' || replace(replace(cast(new."cAuthor" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_author" is null then '' else '"' || replace(replace(cast(new."sorted_author" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_filename" is null then '' else '"' || replace(replace(cast(new."tsv_filename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_tab" is null then '' else '"' || replace(replace(cast(new."tsv_tab" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_desc" is null then '' else '"' || replace(replace(cast(new."tsv_desc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_exhibit" is null then '' else '"' || replace(replace(cast(new."tsv_exhibit" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_author" is null then '' else '"' || replace(replace(cast(new."tsv_author" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cPrefix" is null then '' else '"' || replace(replace(cast(new."cPrefix" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundleid" is null then '' else '"' || replace(replace(cast(new."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nSectionid" is null then '' else '"' || replace(replace(cast(new."nSectionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCreateId" is null then '' else '"' || replace(replace(cast(new."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUpdateId" is null then '' else '"' || replace(replace(cast(new."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnBundleid" is null then '' else '"' || cast(cast(new."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnCreateId" is null then '' else '"' || cast(cast(new."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when new."ZnSectionid" is null then '' else '"' || cast(cast(new."ZnSectionid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUpdateId" is null then '' else '"' || cast(cast(new."ZnUpdateId" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
