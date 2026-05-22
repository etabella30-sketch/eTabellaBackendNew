CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rhghlghtmpd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RHighlightMapid',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      265,                                                                                                                                             
                                      
          case when old."nMapid" is null then '' else '"' || replace(replace(cast(old."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nMapid" is null then '' else '"' || replace(replace(cast(old."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."serialno" is null then '' else '"' || cast(cast(old."serialno" as numeric) as varchar) || '"' end||','||
          case when old."nHid" is null then '' else '"' || replace(replace(cast(old."nHid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nIid" is null then '' else '"' || replace(replace(cast(old."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnHid" is null then '' else '"' || cast(cast(old."ZnHid" as numeric) as varchar) || '"' end||','||
          case when old."ZnIid" is null then '' else '"' || cast(cast(old."ZnIid" as numeric) as varchar) || '"' end||','||
          case when old."ZnMapid" is null then '' else '"' || cast(cast(old."ZnMapid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_rhighlightmapid',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
