CREATE OR REPLACE FUNCTION task.fsym_on_d_for_tsk_tskdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'TaskDetail',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      223,                                                                                                                                             
                                      
          case when old."nTDid" is null then '' else '"' || replace(replace(cast(old."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nTDid" is null then '' else '"' || replace(replace(cast(old."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nStart" is null then '' else '"' || cast(cast(old."nStart" as numeric) as varchar) || '"' end||','||
          case when old."version" is null then '' else '"' || replace(replace(cast(old."version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBDid" is null then '' else '"' || replace(replace(cast(old."nBDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTid" is null then '' else '"' || replace(replace(cast(old."nTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDid" is null then '' else '"' || cast(cast(old."ZnBDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTDid" is null then '' else '"' || cast(cast(old."ZnTDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTid" is null then '' else '"' || cast(cast(old."ZnTid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'task_taskdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
