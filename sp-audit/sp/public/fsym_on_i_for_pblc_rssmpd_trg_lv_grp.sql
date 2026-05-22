CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_rssmpd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'RIssueMapid',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      254,                                                                                                                                             
                                      
          case when new."nMapid" is null then '' else '"' || replace(replace(cast(new."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRelid" is null then '' else '"' || cast(cast(new."nRelid" as numeric) as varchar) || '"' end||','||
          case when new."nImpactid" is null then '' else '"' || cast(cast(new."nImpactid" as numeric) as varchar) || '"' end||','||
          case when new."nTempid" is null then '' else '"' || cast(cast(new."nTempid" as numeric) as varchar) || '"' end||','||
          case when new."serialno" is null then '' else '"' || cast(cast(new."serialno" as numeric) as varchar) || '"' end||','||
          case when new."nIDid" is null then '' else '"' || replace(replace(cast(new."nIDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nIid" is null then '' else '"' || replace(replace(cast(new."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnIDid" is null then '' else '"' || cast(cast(new."ZnIDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnIid" is null then '' else '"' || cast(cast(new."ZnIid" as numeric) as varchar) || '"' end||','||
          case when new."ZnMapid" is null then '' else '"' || cast(cast(new."ZnMapid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_rissuemapid',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
