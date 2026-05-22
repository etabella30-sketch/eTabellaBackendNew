CREATE OR REPLACE FUNCTION task.fsym_on_u_for_tsk_tskdtl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nTDid" is null then '' else '"' || replace(replace(cast(new."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nStart" is null then '' else '"' || cast(cast(new."nStart" as numeric) as varchar) || '"' end||','||
          case when new."version" is null then '' else '"' || replace(replace(cast(new."version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBDid" is null then '' else '"' || replace(replace(cast(new."nBDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTid" is null then '' else '"' || replace(replace(cast(new."nTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBDid" is null then '' else '"' || cast(cast(new."ZnBDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTDid" is null then '' else '"' || cast(cast(new."ZnTDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTid" is null then '' else '"' || cast(cast(new."ZnTid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nTDid" is null then '' else '"' || replace(replace(cast(old."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nStart" is null then '' else '"' || cast(cast(old."nStart" as numeric) as varchar) || '"' end||','||
          case when old."version" is null then '' else '"' || replace(replace(cast(old."version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBDid" is null then '' else '"' || replace(replace(cast(old."nBDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTid" is null then '' else '"' || replace(replace(cast(old."nTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDid" is null then '' else '"' || cast(cast(old."ZnBDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTDid" is null then '' else '"' || cast(cast(old."ZnTDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTid" is null then '' else '"' || cast(cast(old."ZnTid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'TaskDetail',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      223,                                                                                                                                             
                                      
          case when old."nTDid" is null then '' else '"' || replace(replace(cast(old."nTDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'task_taskdetail',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
