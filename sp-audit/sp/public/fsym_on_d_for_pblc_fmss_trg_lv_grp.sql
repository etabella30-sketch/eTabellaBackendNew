CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_fmss_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'FMIssue',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      243,                                                                                                                                             
                                      
          case when old."nFMIid" is null then '' else '"' || replace(replace(cast(old."nFMIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nFMIid" is null then '' else '"' || replace(replace(cast(old."nFMIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nImpactid" is null then '' else '"' || cast(cast(old."nImpactid" as numeric) as varchar) || '"' end||','||
          case when old."nRelevanceid" is null then '' else '"' || cast(cast(old."nRelevanceid" as numeric) as varchar) || '"' end||','||
          case when old."nFSid" is null then '' else '"' || replace(replace(cast(old."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nIssueid" is null then '' else '"' || replace(replace(cast(old."nIssueid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnFMIid" is null then '' else '"' || cast(cast(old."ZnFMIid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSid" is null then '' else '"' || cast(cast(old."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnIssueid" is null then '' else '"' || cast(cast(old."ZnIssueid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_fmissue',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
