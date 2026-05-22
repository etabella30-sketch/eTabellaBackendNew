CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_sctnmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'SectionMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      266,                                                                                                                                             
                                      
          case when old."nSectionid" is null then '' else '"' || replace(replace(cast(old."nSectionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nSectionid" is null then '' else '"' || replace(replace(cast(old."nSectionid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFolder" is null then '' else '"' || replace(replace(cast(old."cFolder" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIcon" is null then '' else '"' || replace(replace(cast(old."cIcon" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFoldertype" is null then '' else '"' || replace(replace(cast(old."cFoldertype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cMsg" is null then '' else '"' || replace(replace(cast(old."cMsg" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nOSectionid" is null then '' else '"' || cast(cast(old."nOSectionid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSectionid" is null then '' else '"' || cast(cast(old."ZnSectionid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_sectionmaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
