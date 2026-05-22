CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rhghlghtmpd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nMapid" is null then '' else '"' || replace(replace(cast(new."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTempid" is null then '' else '"' || cast(cast(new."nTempid" as numeric) as varchar) || '"' end||','||
          case when new."serialno" is null then '' else '"' || cast(cast(new."serialno" as numeric) as varchar) || '"' end||','||
          case when new."nHid" is null then '' else '"' || replace(replace(cast(new."nHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nIid" is null then '' else '"' || replace(replace(cast(new."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnHid" is null then '' else '"' || cast(cast(new."ZnHid" as numeric) as varchar) || '"' end||','||
          case when new."ZnIid" is null then '' else '"' || cast(cast(new."ZnIid" as numeric) as varchar) || '"' end||','||
          case when new."ZnMapid" is null then '' else '"' || cast(cast(new."ZnMapid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nMapid" is null then '' else '"' || replace(replace(cast(old."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."serialno" is null then '' else '"' || cast(cast(old."serialno" as numeric) as varchar) || '"' end||','||
          case when old."nHid" is null then '' else '"' || replace(replace(cast(old."nHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nIid" is null then '' else '"' || replace(replace(cast(old."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnHid" is null then '' else '"' || cast(cast(old."ZnHid" as numeric) as varchar) || '"' end||','||
          case when old."ZnIid" is null then '' else '"' || cast(cast(old."ZnIid" as numeric) as varchar) || '"' end||','||
          case when old."ZnMapid" is null then '' else '"' || cast(cast(old."ZnMapid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RHighlightMapid',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      265,                                                                                                                                             
                                      
          case when old."nMapid" is null then '' else '"' || replace(replace(cast(old."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_rhighlightmapid',                                                                                                                                                
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
