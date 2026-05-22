CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_bndlmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'BundleMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      242,                                                                                                                                             
                                      
          case when old."nBundleid" is null then '' else '"' || replace(replace(cast(old."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nBundleid" is null then '' else '"' || replace(replace(cast(old."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cBundlename" is null then '' else '"' || replace(replace(cast(old."cBundlename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cBundletag" is null then '' else '"' || replace(replace(cast(old."cBundletag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cTempid" is null then '' else '"' || replace(replace(cast(old."cTempid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTempbundleid" is null then '' else '"' || cast(cast(old."nTempbundleid" as numeric) as varchar) || '"' end||','||
          case when old."nTempparentbundleid" is null then '' else '"' || cast(cast(old."nTempparentbundleid" as numeric) as varchar) || '"' end||','||
          case when old."sorted_bundletag" is null then '' else '"' || replace(replace(cast(old."sorted_bundletag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sorted_name" is null then '' else '"' || replace(replace(cast(old."sorted_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_bundletag" is null then '' else '"' || replace(replace(cast(old."tsv_bundletag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tsv_bundlename" is null then '' else '"' || replace(replace(cast(old."tsv_bundlename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nParentBundleid" is null then '' else '"' || replace(replace(cast(old."nParentBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nSectionid" is null then '' else '"' || replace(replace(cast(old."nSectionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCreateId" is null then '' else '"' || replace(replace(cast(old."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUpdateId" is null then '' else '"' || replace(replace(cast(old."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBundleid" is null then '' else '"' || cast(cast(old."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCreateId" is null then '' else '"' || cast(cast(old."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when old."ZnParentBundleid" is null then '' else '"' || cast(cast(old."ZnParentBundleid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSectionid" is null then '' else '"' || cast(cast(old."ZnSectionid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUpdateId" is null then '' else '"' || cast(cast(old."ZnUpdateId" as numeric) as varchar) || '"' end,                                                                                                                                                   
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
