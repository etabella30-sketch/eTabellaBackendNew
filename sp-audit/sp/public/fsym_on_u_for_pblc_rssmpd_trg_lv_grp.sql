CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rssmpd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nMapid" is null then '' else '"' || replace(replace(cast(new."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRelid" is null then '' else '"' || cast(cast(new."nRelid" as numeric) as varchar) || '"' end||','||
          case when new."nImpactid" is null then '' else '"' || cast(cast(new."nImpactid" as numeric) as varchar) || '"' end||','||
          case when new."nTempid" is null then '' else '"' || cast(cast(new."nTempid" as numeric) as varchar) || '"' end||','||
          case when new."serialno" is null then '' else '"' || cast(cast(new."serialno" as numeric) as varchar) || '"' end||','||
          case when new."nIDid" is null then '' else '"' || replace(replace(cast(new."nIDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nIid" is null then '' else '"' || replace(replace(cast(new."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnIDid" is null then '' else '"' || cast(cast(new."ZnIDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnIid" is null then '' else '"' || cast(cast(new."ZnIid" as numeric) as varchar) || '"' end||','||
          case when new."ZnMapid" is null then '' else '"' || cast(cast(new."ZnMapid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nMapid" is null then '' else '"' || replace(replace(cast(old."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRelid" is null then '' else '"' || cast(cast(old."nRelid" as numeric) as varchar) || '"' end||','||
          case when old."nImpactid" is null then '' else '"' || cast(cast(old."nImpactid" as numeric) as varchar) || '"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."serialno" is null then '' else '"' || cast(cast(old."serialno" as numeric) as varchar) || '"' end||','||
          case when old."nIDid" is null then '' else '"' || replace(replace(cast(old."nIDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nIid" is null then '' else '"' || replace(replace(cast(old."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnIDid" is null then '' else '"' || cast(cast(old."ZnIDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnIid" is null then '' else '"' || cast(cast(old."ZnIid" as numeric) as varchar) || '"' end||','||
          case when old."ZnMapid" is null then '' else '"' || cast(cast(old."ZnMapid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RIssueMapid',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      254,                                                                                                                                             
                                      
          case when old."nMapid" is null then '' else '"' || replace(replace(cast(old."nMapid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_rissuemapid',                                                                                                                                                
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
