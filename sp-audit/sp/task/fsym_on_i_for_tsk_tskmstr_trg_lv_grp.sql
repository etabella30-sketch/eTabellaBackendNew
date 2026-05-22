CREATE OR REPLACE FUNCTION task.fsym_on_i_for_tsk_tskmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'TaskMaster',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      273,                                                                                                                                             
                                      
          case when new."nTid" is null then '' else '"' || replace(replace(cast(new."nTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTCatid" is null then '' else '"' || cast(cast(new."nTCatid" as numeric) as varchar) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nTotal" is null then '' else '"' || cast(cast(new."nTotal" as numeric) as varchar) || '"' end||','||
          case when new."nCompleted" is null then '' else '"' || cast(cast(new."nCompleted" as numeric) as varchar) || '"' end||','||
          case when new."nFailed" is null then '' else '"' || cast(cast(new."nFailed" as numeric) as varchar) || '"' end||','||
          case when new."dStartDt" is null then '' when isfinite(new."dStartDt") then '"' || to_char(new."dStartDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dLastDt" is null then '' when isfinite(new."dLastDt") then '"' || to_char(new."dLastDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."keepAlive" is null then '' else '"' || cast(cast(new."keepAlive" as numeric) as varchar) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nLinkId" is null then '' else '"' || replace(replace(cast(new."nLinkId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnLinkId" is null then '' else '"' || cast(cast(new."ZnLinkId" as numeric) as varchar) || '"' end||','||
          case when new."ZnTid" is null then '' else '"' || cast(cast(new."ZnTid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
