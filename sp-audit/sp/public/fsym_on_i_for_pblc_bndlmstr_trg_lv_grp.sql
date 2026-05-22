CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_bndlmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'BundleMaster',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      242,                                                                                                                                             
                                      
          case when new."nBundleid" is null then '' else '"' || replace(replace(cast(new."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cBundlename" is null then '' else '"' || replace(replace(cast(new."cBundlename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cBundletag" is null then '' else '"' || replace(replace(cast(new."cBundletag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cTempid" is null then '' else '"' || replace(replace(cast(new."cTempid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTempbundleid" is null then '' else '"' || cast(cast(new."nTempbundleid" as numeric) as varchar) || '"' end||','||
          case when new."nTempparentbundleid" is null then '' else '"' || cast(cast(new."nTempparentbundleid" as numeric) as varchar) || '"' end||','||
          case when new."sorted_bundletag" is null then '' else '"' || replace(replace(cast(new."sorted_bundletag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sorted_name" is null then '' else '"' || replace(replace(cast(new."sorted_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_bundletag" is null then '' else '"' || replace(replace(cast(new."tsv_bundletag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tsv_bundlename" is null then '' else '"' || replace(replace(cast(new."tsv_bundlename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nParentBundleid" is null then '' else '"' || replace(replace(cast(new."nParentBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nSectionid" is null then '' else '"' || replace(replace(cast(new."nSectionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCreateId" is null then '' else '"' || replace(replace(cast(new."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUpdateId" is null then '' else '"' || replace(replace(cast(new."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBundleid" is null then '' else '"' || cast(cast(new."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnCreateId" is null then '' else '"' || cast(cast(new."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when new."ZnParentBundleid" is null then '' else '"' || cast(cast(new."ZnParentBundleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSectionid" is null then '' else '"' || cast(cast(new."ZnSectionid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUpdateId" is null then '' else '"' || cast(cast(new."ZnUpdateId" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_bundlemaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
