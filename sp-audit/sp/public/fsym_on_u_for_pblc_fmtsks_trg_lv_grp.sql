CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_fmtsks_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nFMTsid" is null then '' else '"' || replace(replace(cast(new."nFMTsid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nFSid" is null then '' else '"' || replace(replace(cast(new."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTaskid" is null then '' else '"' || replace(replace(cast(new."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnFMTsid" is null then '' else '"' || cast(cast(new."ZnFMTsid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFSid" is null then '' else '"' || cast(cast(new."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTaskid" is null then '' else '"' || cast(cast(new."ZnTaskid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nFMTsid" is null then '' else '"' || replace(replace(cast(old."nFMTsid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nFSid" is null then '' else '"' || replace(replace(cast(old."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTaskid" is null then '' else '"' || replace(replace(cast(old."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnFMTsid" is null then '' else '"' || cast(cast(old."ZnFMTsid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSid" is null then '' else '"' || cast(cast(old."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTaskid" is null then '' else '"' || cast(cast(old."ZnTaskid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'FMTasks',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      226,                                                                                                                                             
                                      
          case when old."nFMTsid" is null then '' else '"' || replace(replace(cast(old."nFMTsid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_fmtasks',                                                                                                                                                
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
