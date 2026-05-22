CREATE OR REPLACE FUNCTION task.fsym_on_d_for_tsk_tskmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'TaskMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      273,                                                                                                                                             
                                      
          case when old."nTid" is null then '' else '"' || replace(replace(cast(old."nTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nTid" is null then '' else '"' || replace(replace(cast(old."nTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTCatid" is null then '' else '"' || cast(cast(old."nTCatid" as numeric) as varchar) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nTotal" is null then '' else '"' || cast(cast(old."nTotal" as numeric) as varchar) || '"' end||','||
          case when old."nCompleted" is null then '' else '"' || cast(cast(old."nCompleted" as numeric) as varchar) || '"' end||','||
          case when old."nFailed" is null then '' else '"' || cast(cast(old."nFailed" as numeric) as varchar) || '"' end||','||
          case when old."dStartDt" is null then '' when isfinite(old."dStartDt") then '"' || to_char(old."dStartDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dLastDt" is null then '' when isfinite(old."dLastDt") then '"' || to_char(old."dLastDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."keepAlive" is null then '' else '"' || cast(cast(old."keepAlive" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nLinkId" is null then '' else '"' || replace(replace(cast(old."nLinkId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnLinkId" is null then '' else '"' || cast(cast(old."ZnLinkId" as numeric) as varchar) || '"' end||','||
          case when old."ZnTid" is null then '' else '"' || cast(cast(old."ZnTid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'task_taskmaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
